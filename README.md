# **React AI Chat App**

This is a feature-rich, single-page chat application built with React that allows you to have conversations with Google's Gemini AI. The app runs entirely in your browser and saves all your chats to local storage.

A live version of this project is deployed on GitHub Pages.

## **Features**

* **Chat with AI:** Real-time, streaming-like conversation with the Gemini API.  
* **Markdown & Code:** AI responses are rendered as Markdown, with support for lists, bolding, and formatted code blocks.  
* **Multi-Chat Management:** A collapsible sidebar allows you to create, manage, and switch between multiple, separate conversations.  
* **Chat Persistence:** All your chats and messages are saved to your browser's localStorage, so your conversations are saved, even if you refresh the page.  
* **Full Chat Controls:**  
  * **Auto-Naming:** Chats are automatically named based on your first message.  
  * **Pin Chat:** Pin your most important conversations to the top of the list.  
  * **Rename Chat:** Give your chats custom names.  
  * **Delete Chat:** Remove old or unwanted conversations.  
  * **Share Chat:** Copy a chat's entire history to your clipboard as JSON.  
* **Message Editing:** You can edit your previous prompts, and the AI will regenerate its response based on your correction.  
* **Regenerate Response:** If you don't like an answer, you can ask the AI to regenerate its last response.  
* **Stop Generation:** If the AI is taking too long, you can stop its response mid-stream.  
* **Search History:** A built-in search bar lets you filter your current chat's message history.  
* **Custom Persona:** A settings modal for each chat lets you define a "System Prompt" to change the AI's persona (e.g., "You are a helpful assistant," "You are a pirate," etc.).  
* **Light/Dark Mode:** A toggle to switch between light and dark themes, which is also saved locally.

## **Getting Started**

To run this project on your local machine, follow these steps.

### **Prerequisites**

* [Node.js](https://nodejs.org/) (v16 or later)  
* npm (comes with Node.js)  
* A Google AI Studio API Key for the Gemini API.

### **Installation**

1. **Clone the repository:**  
   git clone \[https://github.com/wardasanam/react-ai-chat-app.git\](https://github.com/wardasanam/react-ai-chat-app.git)  
   cd react-ai-chat-app

2. **Install dependencies:**  
   npm install

3. Add Your API Key:  
   Open src/App.jsx and find the callGeminiAPI function. Paste your API key into the apiKey variable:  
   // Inside src/App.jsx  
   const callGeminiAPI \= async (chatHistory, systemPrompt, signal) \=\> {  
      const apiKey \= 'YOUR\_API\_KEY\_HERE'; // \<--- PASTE YOUR KEY HERE  
      // ...  
   }

4. Run the app:  
   This will start the local development server.  
   npm start

   Open [http://localhost:3000](https://www.google.com/search?q=http://localhost:3000) to see your app in the browser.

## **Deployment**

This project is already configured for easy deployment to GitHub Pages.

1. **Commit and push** any changes you've made:  
   git add .  
   git commit \-m "My new updates"  
   git push origin main

2. Run the deploy script:  
   This will automatically build the project and push the build folder to the gh-pages branch on GitHub.  
   npm run deploy

After a few minutes, your site will be live at the URL specified in your package.json's homepage field:  
https://www.google.com/search?q=https://wardasanam.github.io/react-ai-chat-app