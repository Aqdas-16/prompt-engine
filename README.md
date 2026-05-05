# Prompt Genius API

A production-ready Node.js (Express) backend API for transforming simple user inputs into optimized LLM prompts using Google's Gemini AI.

## Project Structure

- `server.ts`: Express server entry point with Vite middleware.
- `llmService.ts`: Core logic for interacting with Google Gemini API.
- `prompts/`: Directory containing system prompt templates.
  - `normal.txt`: Basic prompt optimization.
  - `advanced.txt`: Sophisticated prompt engineering.
- `src/App.tsx`: React frontend to interact with the API.

## API Endpoint

### `POST /api/generate`

Generates an optimized prompt based on user input and mode.

**Request Body:**
```json
{
  "user_input": "string (max 2000 chars)",
  "mode": "normal | advanced"
}
```

**Response:**
```json
{
  "success": true,
  "prompt": "The optimized prompt text..."
}
```

## How to Run Locally

1.  **Clone the repository.**
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Set up environment variables:**
    Create a `.env` file in the root directory and add your Gemini API key:
    ```env
    GEMINI_API_KEY=your_api_key_here
    ```
4.  **Start the development server:**
    ```bash
    npm run dev
    ```
5.  **Build for production:**
    ```bash
    npm run build
    npm start
    ```

## Constraints & Features

- **No Hardcoded Prompts**: System prompts are loaded from `.txt` files.
- **Input Validation**: Strict type and length checking on the backend.
- **Error Handling**: Graceful error management for API and filesystem issues.
- **Zero Exposure**: API keys are strictly server-side.
- **Modern Stack**: Built with TypeScript, Express, Vite, and React.
