import random
import logging

logging.basicConfig(filename="chatbot.log", level=logging.INFO)

class SecurityChatbot:
    """
    Simple rule-based chatbot to assist with file security queries.
    """

    def __init__(self):
        self.responses = {
            "hello": "Hello! How can I assist you with file security today?",
            "how are you": "I'm just a bot, but I'm running securely!",
            "malware": "If you suspect malware, I can run a malicious file detection for you.",
            "sensitive": "I can help classify if a file contains sensitive data.",
            "phishing": "Be cautious of suspicious links and email attachments. Always verify the sender!",
            "compliance": "We support compliance by keeping audit logs and encryption policies.",
            "bye": "Goodbye! Stay safe and secure."
        }

    def get_response(self, user_input: str) -> str:
        """
        Returns a chatbot response based on user input.
        """
        user_input = user_input.lower().strip()
        logging.info(f"User: {user_input}")

        if user_input in self.responses:
            return self.responses[user_input]

        if "scan" in user_input:
            return "Sure! Please upload the file and I'll start scanning."
        if "encrypt" in user_input:
            return "Encryption is a great way to protect your files!"
        if "decrypt" in user_input:
            return "Decryption will require a valid key. Do you have one?"

        return random.choice([
            "Sorry, I didn't quite get that. Can you rephrase?",
            "Hmm... I'm not sure about that. Can you give me more details?",
            "Let's talk about file security. What do you need help with?"
        ])


if __name__ == "__main__":
    bot = SecurityChatbot()
    print("🔒 Obsidian File Core Security Assistant 🤖 (type 'bye' to exit)")
    while True:
        query = input("You: ")
        if query.lower() == "bye":
            print(bot.get_response("bye"))
            break
        print("Bot:", bot.get_response(query))
