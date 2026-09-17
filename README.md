# Quizster

Turn study PDFs into mixed quizzes and race friends with a room code.

## Setup

1. Install Node.js 20+, then in this folder run `npm install`.
2. Copy `.env.example` to `.env.local`.
3. Create a Firebase project. Enable **Email/Password** and **Google** auth, Firestore, and Storage.
4. Paste the Firebase web app config into `.env.local`.
5. Create a Gemini API key and set `GEMINI_API_KEY`.
6. Deploy the included `firestore.rules` (and `storage.rules` if you use Storage).
7. Run `npm run dev` and open [http://localhost:3000](http://localhost:3000).

## Demo flow

1. Sign up.
2. Upload a notes PDF and generate a quiz.
3. Host a room, share the 6-character code.
4. Friends join from Home. Host starts. Everyone answers the full quiz, then see the podium.
