# Support Center

This project contains both a React frontend (using TailAdmin) and a NestJS backend API.

---

## Table of Contents

- [Frontend (React + Tailwind)](#frontend-react--tailwind)
- [Backend (NestJS)](#backend-nestjs)
- [Running the Full Stack](#running-the-full-stack)
- [License](#license)

---

## Frontend (React + Tailwind)

The frontend is located in the root of this repository.

### Setup & Start

1. **Install dependencies:**

   ```bash
   npm install
   # or
   yarn install
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

The frontend will be available at [http://localhost:5173](http://localhost:5173) (or the port shown in your terminal).

---

## Backend (NestJS)

The backend is located in the [`backend`](backend/README.md) folder.

### Setup & Start

1. **Install dependencies:**

   ```bash
   cd backend
   npm install
   ```

2. **Start the backend server:**

   ```bash
   # For development
   npm run start:dev

   # For production
   npm run start:prod
   ```

The backend will be available at [http://localhost:3000](http://localhost:3000) by default.

---

## Running the Full Stack

To run both frontend and backend locally:

1. Open two terminal windows/tabs.
2. In the first, start the frontend as described above.
3. In the second, start the backend as described above.

---

## License

This project is [MIT licensed](LICENSE.md).
