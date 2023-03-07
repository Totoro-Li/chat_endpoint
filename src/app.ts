import express from "express";
import axios from "axios";
import {Configuration, OpenAIApi} from "openai";
import {ConfigInterface, MessageInterface} from "./chat";

export const apiKey = process.env.OPENAI_API_KEY;
export const endpoint = 'https://api.openai.com/v1/chat/completions';

const app = express();
app.use(express.json());
// Add CORS headers
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', 'https://pkucs.top');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

// Route for POST requests with text message
app.post("/chat", async (req, res) => {
    try {
        // Get text prompt from POST request
        const model = req.body.model;
        const messages: MessageInterface[] = req.body.messages;

        console.log(req.body);
        // Config options for OpenAI API request
        const config: ConfigInterface = {
            temperature: req.body.temperature || 0.9,
            presence_penalty: req.body.presence_penalty || 0,
        };

        const stream: boolean = req.body.stream || true;

        // Call OpenAI API to generate response
        const response = await fetch(endpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: `${model}`,
                messages,
                stream: true,
                ...config,
            }),
        });

        if (!response.ok) {
            throw new Error(await response.text());
        }

        // Return response stream to POST request
        const reader = response.body.getReader();
        res.setHeader("Content-Type", "text/html");
        res.flushHeaders();
        while (true) {
            const {done, value} = await reader.read();
            if (done) break;
            res.write(value);
        }
        res.end();
    } catch (error) {
        console.error(error);
        res.status(500).send("An error occurred while processing the request");
    }
});
app.listen(process.env.PORT || 3000, () => {
    console.log(`Server listening on port ${process.env.PORT || 3000}`);
});
