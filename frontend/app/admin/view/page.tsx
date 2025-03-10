"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast, Toaster } from "react-hot-toast";
import { Trash, FileText, Sparkles } from 'lucide-react';
import { Button } from "@nextui-org/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Document {
  docName: string;
  type: string;
}

const SavedDocumentsPage: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [chunks, setChunks] = useState<any[]>([]);
  const [loadingChunks, setLoadingChunks] = useState<boolean>(false);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const response = await axios.get("http://localhost:5000/api/documents");
      setDocuments(response.data);
    } catch (error) {
      toast.error("Failed to fetch documents.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  

  const handleViewDetails = async (doc: Document) => {
    setSelectedDoc(doc);
    setIsModalOpen(true);
    setLoadingChunks(true);
    try {
      const response = await axios.get(
        `http://localhost:5000/api/documents/${encodeURIComponent(doc.docName)}`
      );
      setChunks(response.data);
    } catch (error) {
      toast.error("Failed to fetch document details.");
      console.error(error);
    } finally {
      setLoadingChunks(false);
    }
  };

  return (
    <div className="flex h-screen w-full bg-gray-100 text-gray-900">
      <div className="flex flex-col w-full max-w-screen-2xl mx-auto p-4 lg:p-6 h-full">
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-t-xl">
          <div className="flex items-center">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white text-purple-600 flex items-center justify-center font-bold text-lg sm:text-xl mr-2 sm:mr-3">
              EM
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white">EduMitra</h2>
              <p className="text-xs sm:text-sm text-white opacity-75">Saved Documents</p>
            </div>
          </div>
        </div>
        
        <div className="flex-1 bg-white rounded-b-xl overflow-hidden transition-colors duration-500 p-4">
          <Toaster />
          <h1 className="text-3xl font-bold text-center mb-6 flex items-center justify-center">
            <Sparkles className="mr-2 text-yellow-500" /> Saved Documents
          </h1>

          {loading ? (
            <div className="flex justify-center items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
              <span className="ml-2 text-purple-600">Loading documents...</span>
            </div>
          ) : documents.length === 0 ? (
            <p className="text-center text-gray-500">
              No documents found. Upload some documents to get started!
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {documents.map((doc) => (
                <Card key={doc.docName} className="bg-gradient-to-br from-purple-50 to-pink-50 border-none shadow-md hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex justify-between items-center">
                      <span className="truncate text-purple-700">{doc.docName}</span>
                      <span className="text-sm text-pink-600 font-semibold">
                        {doc.type.toUpperCase()}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardFooter className="flex justify-end space-x-2">
                    <Button onClick={() => handleViewDetails(doc)} variant="solid" className="bg-white text-purple-600 hover:bg-purple-100 rounded-lg">
                      <FileText className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                    
                   
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[725px] bg-gradient-to-br from-purple-50 to-pink-50">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-purple-700">{selectedDoc?.docName} Details</DialogTitle>
            <DialogDescription className="text-pink-600">
              View the content chunks of your document.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            {loadingChunks ? (
              <div className="flex justify-center items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
                <span className="ml-2 text-purple-600">Loading details...</span>
              </div>
            ) : chunks.length === 0 ? (
              <p className="text-gray-500">
                No details available for this document.
              </p>
            ) : (
              <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-purple-700">Description</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {chunks.map((chunk, index) => (
                      <TableRow key={index}>
                        <TableCell className="text-gray-800">{chunk.text}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setIsModalOpen(false)} className="bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 rounded-lg">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SavedDocumentsPage;