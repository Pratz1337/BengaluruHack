"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import * as THREE from "three";
import styles from "./Login.module.css";
import { useAuth } from "../authContext";
import { Eye, EyeOff, User, Lock } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<string>(""); // "success" or "error"
  const { login } = useAuth(); // Access login function
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animationFrameId = useRef<number | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Initialize Three.js scene
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      alpha: true,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);

    sceneRef.current = scene;
    cameraRef.current = camera;
    rendererRef.current = renderer;

    // Create particles
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 5000;
    const posArray = new Float32Array(particlesCount * 3);

    for (let i = 0; i < particlesCount * 3; i++) {
      posArray[i] = (Math.random() - 0.5) * 5;
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

    const particlesMaterial = new THREE.PointsMaterial({
      size: 0.005,
      color: 0x66a6ff,
    });

    const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particlesMesh);

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    camera.position.z = 3;

    // Animation
    const animate = () => {
      if (particlesMesh && scene && camera && renderer) {
        particlesMesh.rotation.y += 0.001;
        renderer.render(scene, camera);
        animationFrameId.current = requestAnimationFrame(animate);
      }
    };
    animate();

    // Resize handler
    const handleResize = () => {
      if (camera && renderer) {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      }
    };

    window.addEventListener('resize', handleResize);

    // Cleanup on unmount
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      if (renderer) {
        renderer.dispose();
      }
      if (particlesGeometry) {
        particlesGeometry.dispose();
      }
      if (particlesMaterial) {
        particlesMaterial.dispose();
      }
    };
  }, []);

  const handleLogin = async () => {
    try {
      const response = await axios.post("http://localhost:5000/api/login", {
        username,
        password,
      });
      if (response.data.success) {
        setMessage(response.data.message);
        setMessageType("success");
        login(); // Set global authenticated state
        router.push("/admin");
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        setMessage(error.response?.data?.message || "Login failed!");
      } else {
        setMessage("An unexpected error occurred.");
      }
      setMessageType("error");
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className={styles.container}>
      <canvas ref={canvasRef} className={styles.canvas}></canvas>
      <div className={styles.glassCard}>
        <h1 className={styles.header}>EduMitra Admin</h1>
        <p className={styles.subheader}>Log in to continue</p>
        <div className={styles.inputGroup}>
          <div className={styles.inputWrapper}>
            <User className={styles.inputIcon} size={20} />
            <input
              type="text"
              className={styles.input}
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
        </div>
        <div className={styles.inputGroup}>
          <div className={styles.inputWrapper}>
            <Lock className={styles.inputIcon} size={20} />
            <input
              type={showPassword ? "text" : "password"}
              className={styles.input}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className={styles.passwordToggle}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>
        {message && (
          <div className={`${styles.message} ${styles[messageType]}`}>
            <p>{message}</p>
          </div>
        )}
        <button className={styles.button} onClick={handleLogin}>
          Log In
        </button>
      </div>
    </div>
  );
}

