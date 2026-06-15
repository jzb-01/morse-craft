# MORSE-CRAFT

> A Morse code learning platform featuring real-time translation, interactive training, audio playback, and a virtual telegraph key.

Built with Flask, SQLite, SQLAlchemy, and the Web Audio API, Morse-Craft combines educational tools, community features, and a vintage communications aesthetic to create an engaging environment for learning Morse code.

---

## 🚀 Live Demo & Visuals

- **Application Link:** https://morse-craft.onrender.com/

## 🧪 Suggested Interactions

Try these workflows to explore the application:

- **Translate a message:** Navigate to the **Translator** and type text in the left panel — watch it convert to Morse in real time.
- **Send a telegraph:** Go to the **Telegraph** and click or hold the spacebar to tap out dots and dashes with live audio feedback.
- **Train your ear:** Open **Training**, select character groups, press START, and type what you hear to unlock new characters.
- **Browse the archives:** Visit the **Archives** to explore classified transmissions and play back their Morse code.
- **Save your work:** Log in, tap out a message on the Telegraph, and save it as a personal note or post it to public Comments.

You can also experiment with the Codebook by clicking any row to hear the Morse code for that character.

### App Preview

|           Home Page           |              Codebook              |
| :---------------------------: | :--------------------------------: |
| ![Home Page](assets/home.png) | ![Translator](assets/codebook.png) |

|                  Borwser                  |                  Reader                   |
| :---------------------------------------: | :---------------------------------------: |
| ![Home Page](assets/archives_browser.png) | ![Translator](assets/archives_reader.png) |

|             Auth              |              Translator              |
| :---------------------------: | :----------------------------------: |
| ![Home Page](assets/auth.png) | ![Translator](assets/translator.png) |

|             Telegraph              |             Training             |
| :--------------------------------: | :------------------------------: |
| ![Telegraph](assets/telegraph.png) | ![Training](assets/training.png) |

---

## 📑 Overview

Morse-Craft is a full-stack web application designed to help users learn, practice, and explore Morse code through a collection of interactive tools.

Unlike simple translation tools, Morse-Craft focuses on active learning. Users can listen to Morse code, practice recognition, improve transmission skills, and gradually unlock new characters through structured training exercises.

The platform combines translation tools, interactive training, a virtual telegraph key, community features, and historical-style archives within a telegraph-inspired user interface.

## ✨ Highlights

- **Real-Time Translation**: Instantly convert between text and Morse code with adjustable playback speed.
- **Virtual Telegraph Key**: Transmit Morse code using mouse, keyboard, or touch input while receiving authentic audio feedback.
- **Progressive Training System**: Unlock new characters only after achieving high accuracy, creating a structured learning path.
- **Community Features**: Save private notes or share Morse messages publicly.
- **Classified Archives**: Explore historical-style transmissions and replay them as Morse audio.
- **Unified Audio Engine**: Consistent Morse playback across every interactive feature.

---

## 🛠️ Technology Stack

| Layer              | Technologies & Libraries Used                |
| :----------------- | :------------------------------------------- |
| **Frontend UI**    | HTML5, CSS3, Vanilla JavaScript (ES Modules) |
| **Backend Server** | Python, Flask                                |
| **Database**       | SQLite, SQLAlchemy ORM                       |
| **Authentication** | Werkzeug (password hashing), Flask-Session   |
| **Audio**          | Web Audio API (OscillatorNode, GainNode)     |

---

## 🏗️ System Architecture & Data Flow

### Page & API Flow

```text
┌─────────────────────────────────────────────────────┐
│                   TEMPLATES (Jinja2)                │
│  index · codebook · archive · notes · comments      │
│  auth · account · translator · telegraph · training │
└──────────────────────┬──────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────┐
│                  JAVASCRIPT MODULES                 │
│  codebook.js · archive.js · notes.js · comments.js  │
│  translator.js · telegraph.js · training.js         │
│  data.js (conversion tables) · utils.js (beep)      │
└──────────────────────┬──────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────┐
│                    API ENDPOINTS                    │
│  /api/codebook/<type>     /api/archive/<id>         │
│  /api/note/<id>           /api/notes (POST)         │
│  /api/notedelete/<id>     /api/comments/<id>        │
│  /api/comment (POST)      /api/commentdelete/<id>   │
└─────────────────────────────────────────────────────┘
```

### Database Design

Morse-Craft uses a relational SQLite database managed through SQLAlchemy ORM.

```text
┌─────────┐
│  Users  │
└────┬────┘
     │
     ├───────────┐
     │           │
     ▼           ▼
┌─────────┐ ┌──────────┐
│  Notes  │ │ Comments │
└─────────┘ └──────────┘

┌──────────┐
│ Archives │
└──────────┘
```

#### Core Entities

- **Users** — Account information, authentication credentials, and ownership of user-generated content.
- **Notes** — Private Morse code messages saved by authenticated users.
- **Comments** — Public Morse code messages shared with the community.
- **Archives** — Curated historical-style transmissions used for exploration and listening practice.

#### Design Decisions

- User-generated content is stored as Morse code rather than plain text, allowing consistent playback and interaction across the application.
- Notes and Comments are linked to user accounts through foreign-key relationships.
- Archive records are pre-seeded and serve as reusable training and exploration content.
- SQLAlchemy manages relationships, constraints, and database interactions through ORM models.

````
## 📂 Project Structure

```text
morse-craft/
├── static/
│   ├── css/
│   └── js/
├── templates/
├── instance/
├── app.py
├── models.py
├── seed.py
└── requirements.txt
````

---

## ⚙️ Installation & Setup

Follow these steps to clone the project, configure dependencies, and run the application locally.

```bash
git clone https://github.com/jzb-01/morse-craft.git
cd morse-craft

python -m venv venv

# Linux/macOS
source venv/bin/activate

# Windows
venv\Scripts\activate

pip install -r requirements.txt
```

### Start the Application

```bash
python app.py
```

Once running, open your web browser and navigate to: `http://127.0.0.1:5000`

---

## 💡 Technical Challenges

- **Real-Time Telegraph Key:** Building a virtual telegraph key that accurately classifies press duration as dots or dashes while supporting simultaneous mouse, keyboard, and touch input — with smooth audio fade-in/out to eliminate clicks and pops.
- **Morse Audio Engine:** Implementing a consistent, reusable Web Audio API beep utility used across seven different JavaScript modules, each with its own playback requirements (live key tone, sequential playback of stored content, training exercise generation).
- **Progressive Training Logic:** Designing a character-unlocking system that introduces new characters only after achieving 90%+ accuracy on position-by-position evaluation, while maintaining a shuffled character pool across multiple selected groups.
- **Authentication & Authorization:** Managing session-based authentication with protected API endpoints that return appropriate 401/403 responses, and conditionally rendering UI elements (save buttons, delete buttons) based on ownership.
- **Content-as-Morse Paradigm:** All user-generated and seed content is stored and displayed as Morse code strings, requiring consistent conversion at the database seeding layer while keeping the UI focused on dots and dashes.

---

## 🧠 What I Learned

Through designing and developing this project, I gained practical, hands-on experience in:

- **Full-Stack Web Development:** Building a complete Flask application with server-rendered templates, RESTful API endpoints, and modular client-side JavaScript.
- **Web Audio API:** Generating and controlling real-time audio with OscillatorNode and GainNode, managing AudioContext lifecycle across multiple pages and user interactions.
- **Database Design with SQLAlchemy:** Modeling entities with relationships, foreign keys, and server-side defaults, plus seeding databases with programmatically transformed data.
- **Authentication Systems:** Implementing password hashing with Werkzeug, session management with Flask-Session, and route protection with proper HTTP status codes.
- **Event-Driven UI Programming:** Handling complex input scenarios — mouse, keyboard, touch, and window focus events — with state machines for press tracking.
- **Modular JavaScript Architecture:** Organizing client-side code into ES modules with shared utilities (`utils.js`, `data.js`) imported across multiple feature modules.
- **Progressive Learning UX:** Designing a training system that adapts to user performance, unlocking content progressively to maintain engagement and challenge.

---

## 📌 Potential Enhancements

- **Training Statistics Dashboard:** Track user progress over time with charts showing accuracy trends, characters mastered, and time spent training.
- **Comment Reply Threads:** Extend the Comments model to support nested replies and threaded discussions.
- **Real-Time Multiplayer Telegraph:** Add WebSocket support for two users to communicate via telegraph keys in real time.

---

## 📄 License & Author

- **License:** Distributed under the MIT License. See `LICENSE` for details.
- **Author:** Jordan Zarate
- **Repository:** https://github.com/jzb-01/morse-craft.git
