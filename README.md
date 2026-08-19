# 📊 PollApp

A modern, responsive **polling & survey web application** built with **Angular 19** and powered by **Supabase** as the backend. PollApp lets users browse active surveys, vote on polls, view results, and create new polls — all in real time.

---

## ✨ Features

- 📋 **Browse Polls** — View all active and past surveys in a categorized grid layout
- 🔥 **Ending Soon** — Highlighted carousel for polls expiring soon
- 🗂️ **Category Filter** — Filter polls by topic (Team Activities, Wellness, Gaming, Technology, etc.)
- 🗳️ **Vote on Polls** — Participate in multi-question surveys with multiple-choice answers
- 📊 **Live Results** — See real-time vote percentages per option
- ➕ **Create Polls** — Add new polls with custom questions directly to Supabase
- ⚡ **Real-time Updates** — Polls deleted by others disappear instantly via Supabase Realtime
- 📱 **Responsive Design** — Fully mobile-friendly layout

---

## 🛠️ Tech Stack

| Technology | Version | Purpose |
|---|---|---|
| [Angular](https://angular.io/) | 19.x | Frontend framework |
| [TypeScript](https://www.typescriptlang.org/) | ~5.7 | Type-safe development |
| [Supabase](https://supabase.com/) | 2.x | Database, Auth & Realtime |
| [SCSS](https://sass-lang.com/) | — | Styling |
---

## 📁 Project Structure

```
src/
├── app/
│   ├── core/
│   │   ├── models/          # Shared model interfaces (Poll, PollOption, Vote)
│   │   └── services/
│   │       ├── poll.service.ts      # Business logic + Supabase CRUD
│   │       └── supabase.service.ts  # Supabase client initialization
│   ├── features/
│   │   └── polls/
│   │       ├── poll-list/    # Home screen – browse & filter polls
│   │       ├── poll-detail/  # Vote on a poll & view results
│   │       └── poll-create/  # Create a new poll
│   └── models/
│       └── poll.model.ts     # Poll, PollOption, Vote interfaces
├── environments/             # Supabase credentials (not committed)
└── styles.scss               # Global styles
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [Angular CLI](https://angular.io/cli) v19
- A [Supabase](https://supabase.com/) project

### Clone the repository

```bash
git clone https://github.com/your-username/poll-app.git
cd poll-app
```

## 🗺️ App Routes

| Route | Component | Description |
|---|---|---|
| `/` | → redirects | Redirects to `/polls` |
| `/polls` | `PollListComponent` | Browse all polls |
| `/polls/create` | `PollCreateComponent` | Create a new poll |
| `/polls/:id` | `PollDetailComponent` | View & vote on a poll |

---

## 📊 Poll Categories

PollApp supports the following survey categories out of the box:

- 🏃 Team Activities
- 💪 Health & Wellness
- 🎮 Gaming & Entertainment
- 📚 Education & Learning
- 🌿 Lifestyle & Preferences
- 💡 Technology & Innovation
- 🏢 Workplace Culture

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

<p align="center">
  Built with ❤️ using Angular & Supabase
</p>