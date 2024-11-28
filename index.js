import express from 'express';
import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import session from 'express-session';
import { Simulation } from './dataschema.js';
import Person from './js/Person.js'; // Import Person class
import Post from './js/Post.js'; // Import Post class
import { v4 as uuidv4 } from 'uuid';

const app = express();
app.use(express.json());
app.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized: false,
}));

const PORT = process.env.PORT || 3000;

// Connect to MongoDB
mongoose.connect(process.env.DB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});
mongoose.connection.on('connected', () => {
    console.log('Connected to MongoDB');
});

// Create a new session
app.get('/create', async (req, res) => {
    // Generate a unique session ID
    const sessionId = uuidv4();

    // Check if a session already exists in MongoDB
    const existingSession = await Simulation.findOne({ sessionId });
    if (existingSession) {
        return res.status(400).json({ message: 'Session already exists' });
    }

    // Create and save a new session with no nodes or links
    const newSession = new Simulation({
        sessionId,
        nodes: [],
        links: [],
    });

    await newSession.save();

    // Optionally, save the session ID in the user's session object
    req.session.sessionId = sessionId;

    res.json({ message: 'New session created', sessionId });
});


// Initialize a simulation
// Initialize a simulation for an existing session
app.post('/initialize/:id', async (req, res) => {
    const { id } = req.params; // The sessionId from the URL
    const { numPersons, numPosts } = req.query; // Query parameters for number of persons and posts

    try {
        // Find the session by sessionId
        const session = await Simulation.findOne({ sessionId: id });
        if (!session) {
            return res.status(404).json({ message: 'Session not found', sessionId: id });
        }

        // If the session already has nodes, return a message indicating it is already initialized
        if (session.nodes.length > 0) {
            return res.status(400).json({ message: 'Simulation already initialized for this session', sessionId: id });
        }

        // Create nodes and links for the simulation
        const nodes = [];
        const links = [];

        // Create persons
        for (let i = 0; i < numPersons; i++) {
            const person = new Person(
                `person_${uuidv4()}`,
                `Person`,
                Math.random() * 500,
                Math.random() * 500,
                Math.random() * 500,
                { image: `https://example.com/image${i + 1}.png`, username: `user_${i + 1}` }
            );
            nodes.push({
                _id: person.id,
                label: person.label,
                x: person.x,
                y: person.y,
                z: person.z,
                radius: person.radius,
                type: 'Person',
                metadata: {
                    socialScore: person.socialScore,
                    profileImage: person.profileImage,
                    userName: person.userName,
                    growFactor: person.growFactor,
                    friends: Array.from(person.friends.entries()),
                    items: Array.from(person.items.entries()),
                    infoLinks: Array.from(person.infoLinks.entries()),
                },
            });
        }

        // Create posts
        for (let i = 0; i < numPosts; i++) {
            const post = new Post(
                `post_${uuidv4()}`,
                `Social Media Post`,
                Math.random() * 500,
                Math.random() * 500,
                Math.random() * 500,
                { postImage: `https://example.com/post_image${i + 1}.png`, title: `Post ${i + 1}` }
            );
            nodes.push({
                _id: post.id,
                label: post.label,
                x: post.x,
                y: post.y,
                z: post.z,
                radius: post.radius,
                type: 'Post',
                metadata: {
                    image: post.image,
                    title: post.title,
                    growFactor: post.growFactor,
                    readers: Array.from(post.readers.entries()),
                },
            });
        }

        // Update the session in the database with the new nodes and links
        session.nodes = nodes;
        session.links = links; // Assuming no links are added initially
        await session.save();

        res.json({ message: 'Simulation initialized', sessionId: id, numPersons, numPosts });
    } catch (error) {
        console.error('Error initializing simulation:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
});

// Run one simulation step
app.get('/step/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const simulation = await Simulation.findOne({ sessionId: id });
        if (!simulation) {
            return res.status(404).json({ message: 'Simulation not found', sessionId: id });
        }

        const { nodes, links } = simulation;

        const nodeMap = new Map();
        nodes.forEach((node) => {
            if (node.type === 'Person') {
                const person = new Person(node._id, node.label, node.x, node.y, node.z, {
                    image: node.metadata.profileImage,
                    username: node.metadata.userName,
                });
                person.friends = new Map(node.metadata.friends);
                person.items = new Map(node.metadata.items);
                person.infoLinks = new Map(node.metadata.infoLinks);
                person.socialScore = node.metadata.socialScore;
                nodeMap.set(node._id, person);
            } else if (node.type === 'Post') {
                const post = new Post(node._id, node.label, node.x, node.y, node.z, {
                    postImage: node.metadata.image,
                    title: node.metadata.title,
                });
                post.readers = new Map(node.metadata.readers);
                nodeMap.set(node._id, post);
            }
        });

        const reconstructedLinks = new Map(
            links.map((link) => [
                `${link.source}-${link.target}`,
                { fromId: link.source, toId: link.target, type: link.type, score: link.score },
            ])
        );

        nodeMap.forEach((node) => {
            if (node instanceof Person) {
                node.step(nodeMap, reconstructedLinks);
            }
        });

        const updatedNodes = Array.from(nodeMap.values()).map((node) => ({
            _id: node.id,
            label: node.label,
            x: node.x,
            y: node.y,
            z: node.z,
            radius: node.radius,
            type: node instanceof Person ? 'Person' : 'Post',
            metadata: node instanceof Person
                ? {
                    socialScore: node.socialScore,
                    profileImage: node.profileImage,
                    userName: node.userName,
                    growFactor: node.growFactor,
                    friends: Array.from(node.friends.entries()),
                    items: Array.from(node.items.entries()),
                    infoLinks: Array.from(node.infoLinks.entries()),
                }
                : {
                    image: node.image,
                    title: node.title,
                    growFactor: node.growFactor,
                    readers: Array.from(node.readers.entries()),
                },
        }));

        const serializedLinks = Array.from(reconstructedLinks.values()).map((link) => ({
            source: link.fromId,
            target: link.toId,
            type: link.type,
            score: link.score,
        }));

        simulation.nodes = updatedNodes;
        simulation.links = serializedLinks;
        await simulation.save();

        const updatedPositions = updatedNodes.map((node) => ({
            id: node._id,
            label: node.label,
            x: node.x,
            y: node.y,
            z: node.z,
        }));

        const updatedLinks = serializedLinks.map((link) => ({
            source: link.source,
            target: link.target,
            type: link.type,
            score: link.score,
        }));

        res.json({ message: 'Simulation step executed', updatedPositions, updatedLinks });
    } catch (error) {
        console.error('Error executing simulation step:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
});

// End a simulation
app.get('/end/:id', async (req, res) => {
    const { id } = req.params;

    const simulation = await Simulation.findOneAndDelete({ sessionId: id });
    if (!simulation) {
        return res.status(404).json({ message: 'Simulation not found' });
    }

    res.json({ message: 'Simulation ended', id });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
