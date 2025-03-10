"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./authContext";

const withAuth = (WrappedComponent: React.ComponentType) => {
    const ComponentWithAuth = (props: any) => {
        const { isAuthenticated } = useAuth();
        const router = useRouter();

        useEffect(() => {
            if (!isAuthenticated) {
                router.push("/login");
            }
        }, [isAuthenticated, router]);

        if (!isAuthenticated) {
            return null; // Avoid rendering protected components until authenticated
        }

        return <WrappedComponent {...props} />;
    };

    // Add displayName for debugging and ESLint compliance
    ComponentWithAuth.displayName = `withAuth(${WrappedComponent.displayName || WrappedComponent.name || "Component"})`;

    return ComponentWithAuth;
};

export default withAuth;
