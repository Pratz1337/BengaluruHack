"use client";

import "./globals.css";
import React from "react";
import { ReduxProvider } from "@/redux/ReduxProvider";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { AuthProvider } from "@/app/authContext"; // Import the AuthProvider

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-900 text-white">
        <ReduxProvider>
          <GoogleOAuthProvider
            clientId={`568541926291-c822nidma6977gon1vnrnv1hj3fmu16v.apps.googleusercontent.com`}
          >
            <AuthProvider> {/* Wrap children with AuthProvider */}
              {children}
            </AuthProvider>
          </GoogleOAuthProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}
