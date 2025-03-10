'use client'

import React, { useState, useEffect } from "react";
import { Award, Briefcase, TrendingUp, DollarSign, Target, Building2, X } from 'lucide-react';
import Markdown from "react-markdown";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@nextui-org/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CourseDetails {
  name: string
  career_opportunities: string[]
  skills_required: string[]
  industry_demand: string
  average_salary_inr: string
  top_companies: string[]
}

interface ComparisonData {
  course1_details: CourseDetails
  course2_details: CourseDetails
  comparison: string
}

const CourseComparison: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [course1, setCourse1] = useState<string>("");
  const [course2, setCourse2] = useState<string>("");
  const [courses, setCourses] = useState<string[]>([]);
  const [comparisonData, setComparisonData] = useState<ComparisonData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState<boolean>(true);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await fetch(`${process.env.API_URL || "http://localhost:5000"}/get-courses`);
        if (!response.ok) throw new Error("Failed to fetch courses");
        const data = await response.json();
        setCourses(data.courses);
      } catch (error) {
        console.error("Error fetching courses:", error);
        alert("Could not load courses. Please try again later.");
      }
    };

    fetchCourses();
  }, []);

  const handleCompare = async () => {
    if (!course1 || !course2) {
      alert("Please select both courses to compare.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${process.env.API_URL || "http://localhost:5000"}/compare-courses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ course1, course2 }),
      });

      if (!response.ok) throw new Error("Failed to fetch comparison data");

      const data = await response.json();
      setComparisonData(data);
    } catch (error) {
      console.error("Error during comparison:", error);
      alert("Something went wrong while comparing courses.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px] md:max-w-[700px] lg:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="relative">
          <DialogTitle className="text-2xl font-bold text-center text-purple-800 pr-8">Course Comparison Navigator</DialogTitle>
          <Button className="absolute right-0 top-0" variant="ghost" onClick={handleClose}>
            <X className="h-4 text-black w-4" />
          </Button>
        </DialogHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="text-black">
            <label className="block text-black font-medium mb-2">Select First Course:</label>
            <Select onValueChange={setCourse1}>
              <SelectTrigger>
                <SelectValue placeholder="Choose Course" />
              </SelectTrigger>
              <SelectContent>
                {courses.map((course) => (
                  <SelectItem key={course} value={course}>
                    {course}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="text-black">
            <label className="block text-black font-medium mb-2">Select Second Course:</label>
            <Select onValueChange={setCourse2}>
              <SelectTrigger>
                <SelectValue placeholder="Choose Course" />
              </SelectTrigger>
              <SelectContent>
                {courses.map((course) => (
                  <SelectItem key={course} value={course}>
                    {course}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="text-center mb-6">
          <Button
            onClick={handleCompare}
            disabled={isLoading}
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700"
          >
            {isLoading ? "Comparing..." : "Compare Courses"}
          </Button>
        </div>
        {comparisonData && (
          <div className="overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <CourseComparisonCard details={comparisonData.course1_details} />
              <CourseComparisonCard details={comparisonData.course2_details} />
            </div>
            <div className="bg-gray-100 p-4 rounded-lg border">
              <h4 className="font-semibold text-lg mb-2 text-purple-700">Key Insights:</h4>
              <Markdown className="text-gray-700">{comparisonData.comparison}</Markdown>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

const CourseComparisonCard: React.FC<{ details: CourseDetails }> = ({ details }) => {
  return (
    <div className="bg-white shadow-lg rounded-lg p-3 sm:p-4 border-2 border-gray-100">
      <h3 className="text-xl font-bold mb-4 text-center text-purple-700">{details.name}</h3>

      <div className="space-y-4">
        <CourseDetailSection icon={Briefcase} title="Career Opportunities" items={details.career_opportunities} />
        <CourseDetailSection icon={Target} title="Skills Required" items={details.skills_required} isTag />
        <CourseDetailSection icon={TrendingUp} title="Industry Demand" text={details.industry_demand} />
        <CourseDetailSection icon={DollarSign} title="Avg. Salary" text={details.average_salary_inr} />
        <CourseDetailSection icon={Building2} title="Top Companies" items={details.top_companies} isTag />
      </div>
    </div>
  );
};

const CourseDetailSection: React.FC<{
  icon: React.ElementType;
  title: string;
  items?: string[];
  text?: string;
  isTag?: boolean;
}> = ({ icon: Icon, title, items, text, isTag = false }) => {
  return (
    <div>
      <div className="flex items-center mb-2">
        <Icon className="mr-2 text-purple-600" />
        <h4 className="font-semibold text-sm sm:text-base">{title}</h4>
      </div>
      {items ? (
        isTag ? (
          <div className="flex flex-wrap gap-2">
            {items.map((item, index) => (
              <span
                key={index}
                className={`px-2 py-1 rounded-full text-xs sm:text-sm ${
                  isTag ? "bg-purple-100 text-purple-800" : "bg-gray-100 text-gray-800"
                }`}
              >
                {item}
              </span>
            ))}
          </div>
        ) : (
          <ul className="list-disc pl-6 text-gray-700">
            {items.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        )
      ) : (
        <p className="text-gray-700">{text}</p>
      )}
    </div>
  );
};

export default CourseComparison;