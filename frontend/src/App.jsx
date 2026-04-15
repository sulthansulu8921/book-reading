import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import BookGrid from "./components/BookGrid";
import BookReader from "./components/BookReader";
import SecretChat from "./components/SecretChat";
import Login from "./components/Login";

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen w-full bg-dark-900 overflow-x-hidden text-slate-200">
        <Routes>
          <Route path="/" element={<BookGrid />} />
          <Route path="/read/:id" element={<BookReader />} />
          <Route path="/read/:id/:pageId" element={<BookReader />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/chat"
            element={
              <ProtectedRoute>
                <SecretChat />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");
  if (!token) {
    return <Navigate to="/login" />;
  }
  return children;
}
