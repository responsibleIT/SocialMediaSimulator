import mongoose from 'mongoose';

const NodeSchema = new mongoose.Schema({
    _id: String,
    label: String,
    x: Number,
    y: Number,
    z: Number,
    radius: Number,
    type: { type: String, required: true }, // 'Person' or 'Post'
    metadata: { type: mongoose.Schema.Types.Mixed }, // Stores dynamic data (friends, items, etc.)
});

const SimulationSchema = new mongoose.Schema({
    sessionId: { type: String, required: true, unique: true },
    nodes: [NodeSchema],
    links: [
        {
            source: { type: String, required: true }, // ID of the source node
            target: { type: String, required: true }, // ID of the target node
            type: { type: String, required: true },   // Link type
            score: { type: Number, default: 0 },     // Optional score
        },
    ],
});

export const Simulation = mongoose.model('Simulation', SimulationSchema);