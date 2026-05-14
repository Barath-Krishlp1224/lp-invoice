import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

const DEFAULT_DB_NAME = 'lp-invoice';
const COLLECTION_NAME = 'merchant_notes';

const getCollection = async () => {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || DEFAULT_DB_NAME);
    return db.collection(COLLECTION_NAME);
};

export async function GET(request: NextRequest) {
    try {
        const workspaceMode = request.nextUrl.searchParams.get('workspaceMode') || 'others';
        const collection = await getCollection();
        const documents = await collection
            .find({ workspaceMode })
            .project({ _id: 0, merchantKey: 1, note: 1, updatedAt: 1 })
            .toArray();

        const notes = documents.reduce<Record<string, { note: string; updatedAt: string | null }>>((accumulator, document) => {
            if (document.merchantKey) {
                accumulator[document.merchantKey] = {
                    note: String(document.note || ''),
                    updatedAt: document.updatedAt ? new Date(document.updatedAt).toISOString() : null,
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
        await collection.updateOne(
            { workspaceMode, merchantKey },
            {
                $set: {
                    workspaceMode,
                    merchantKey,
                    note,
                    updatedAt: new Date(),
                },
                $setOnInsert: {
                    createdAt: new Date(),
                },
            },
            { upsert: true }
        );

        return NextResponse.json({
            merchantKey,
            note,
            updatedAt: new Date().toISOString(),
        });
    } catch (error) {
        console.error('Failed to save merchant note', error);
        return NextResponse.json(
            { error: 'Failed to save merchant note to MongoDB.' },
            { status: 500 }
        );
    }
}
