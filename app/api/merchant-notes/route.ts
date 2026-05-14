import type { Filter } from 'mongodb';
import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

const DEFAULT_DB_NAME = 'lp-invoice';
const COLLECTION_NAME = 'merchant_notes';

type MerchantNoteHistoryEntry = {
    note: string;
    savedAt: Date;
};

type MerchantNoteDocument = {
    workspaceMode: string;
    merchantKey: string;
    note: string;
    updatedAt?: Date;
    createdAt?: Date;
    history?: MerchantNoteHistoryEntry[];
};

const getCollection = async () => {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || DEFAULT_DB_NAME);
    return db.collection<MerchantNoteDocument>(COLLECTION_NAME);
};

export async function GET(request: NextRequest) {
    try {
        const workspaceMode = request.nextUrl.searchParams.get('workspaceMode') || 'others';
        const collection = await getCollection();
        const documents = await collection
            .find({ workspaceMode })
            .project({ _id: 0, merchantKey: 1, note: 1, updatedAt: 1, history: 1 })
            .toArray();

        const notes = documents.reduce<Record<string, { note: string; updatedAt: string | null; history: { note: string; savedAt: string | null }[] }>>((accumulator, document) => {
            if (document.merchantKey) {
                const history = Array.isArray(document.history)
                    ? document.history.map((entry) => ({
                        note: String(entry?.note || ''),
                        savedAt: entry?.savedAt ? new Date(entry.savedAt).toISOString() : null,
                    })).sort((a, b) => {
                        const aTime = a.savedAt ? new Date(a.savedAt).getTime() : 0;
                        const bTime = b.savedAt ? new Date(b.savedAt).getTime() : 0;
                        return bTime - aTime;
                    })
                    : [];

                if (!history.length && document.note) {
                    history.push({
                        note: String(document.note || ''),
                        savedAt: document.updatedAt ? new Date(document.updatedAt).toISOString() : null,
                    });
                }

                accumulator[document.merchantKey] = {
                    note: String(document.note || ''),
                    updatedAt: document.updatedAt ? new Date(document.updatedAt).toISOString() : null,
                    history,
                };
            }

            return accumulator;
        }, {});

        return NextResponse.json({ notes });
    } catch (error) {
        console.error('Failed to load merchant notes', error);
        return NextResponse.json(
            { error: 'Failed to load merchant notes from MongoDB.' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const workspaceMode = String(body?.workspaceMode || 'others');
        const merchantKey = String(body?.merchantKey || '').trim();
        const note = String(body?.note || '');

        if (!merchantKey) {
            return NextResponse.json(
                { error: 'merchantKey is required.' },
                { status: 400 }
            );
        }

        const collection = await getCollection();
        const savedAt = new Date();
        const filter: Filter<MerchantNoteDocument> = { workspaceMode, merchantKey };
        await collection.updateOne(
            filter,
            {
                $set: {
                    workspaceMode,
                    merchantKey,
                    note,
                    updatedAt: savedAt,
                },
                $push: {
                    history: {
                        note,
                        savedAt,
                    },
                },
                $setOnInsert: {
                    createdAt: savedAt,
                },
            },
            { upsert: true }
        );

        return NextResponse.json({
            merchantKey,
            note,
            updatedAt: savedAt.toISOString(),
            historyEntry: {
                note,
                savedAt: savedAt.toISOString(),
            },
        });
    } catch (error) {
        console.error('Failed to save merchant note', error);
        return NextResponse.json(
            { error: 'Failed to save merchant note to MongoDB.' },
            { status: 500 }
        );
    }
}
