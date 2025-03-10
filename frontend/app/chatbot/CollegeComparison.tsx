'use client'

import React, { useState, useEffect } from "react";
import collegeData from "./data/collegedata.json"; 
import Modal from "./Modal"; 
import { useMediaQuery } from "@react-hook/media-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface College {
  name: string;
  courses: Course[];
}

interface Course {
  name: string;
  cutoff: string;
  fees: string;
  scholarship: string;
  avg_salary: string;
  placement_percentage: string;
}

interface CollegeComparisonProps {
  onClose: () => void;
}

const CollegeComparison: React.FC<CollegeComparisonProps> = ({ onClose }) => {
  const [college1, setCollege1] = useState<string>("");
  const [college2, setCollege2] = useState<string>("");
  const [course1, setCourses] = useState<string>("");
  const [comparisonData, setComparisonData] = useState<{
    college1: Course;
    college2: Course;
    course1: Course;
  } | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(true);

  const handleCollege1Change = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setCollege1(event.target.value);
  };

  const handleCollege2Change = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setCollege2(event.target.value);
  };

  const handleCourseChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setCourses(event.target.value);
  };

  const handleCompare = () => {
    const selectedCollege1 = collegeData.colleges.find(
      (college: College) => college.name === college1
    );
    const selectedCollege2 = collegeData.colleges.find(
      (college: College) => college.name === college2
    );

    if (selectedCollege1 && selectedCollege2) {
      const selectedCourse1 = selectedCollege1.courses.find(
        (course: Course) => course.name === course1
      );
      const selectedCourse2 = selectedCollege2.courses.find(
        (course: Course) => course.name === course1
      );

      if (selectedCourse1 && selectedCourse2) {
        setComparisonData({
          college1: selectedCourse1,
          college2: selectedCourse2,
          course1: selectedCourse1,
        });
        setIsDialogOpen(false);
      } else {
        alert("Course not available in one or both of the selected colleges");
      }
    } else {
      alert("Please select valid colleges.");
    }
  };

  const collegeOptions = collegeData.colleges.map((college: College) => (
    <option key={college.name} value={college.name}>
      {college.name}
    </option>
  ));

  const getCoursesForCollege = (collegeName: string) => {
    const college = collegeData.colleges.find(
      (college: College) => college.name === collegeName
    );
    return college ? college.courses : [];
  };

  const isDesktop = useMediaQuery("(min-width: 768px)");

  return (
    <>
      {isDesktop && !comparisonData ? (
        <div className="max-w-2xl mx-auto p-4 bg-white text-gray-800">
          <h2 className="text-2xl font-bold mb-4">Compare Colleges</h2>

          <div className="mb-4">
            <label className="block">College 1:</label>
            <select
              value={college1}
              onChange={handleCollege1Change}
              className="w-full p-2 border rounded bg-white text-black"
            >
              <option value="">Select a college</option>
              {collegeOptions}
            </select>
          </div>

          <div className="mb-4">
            <label className="block">College 2:</label>
            <select
              value={college2}
              onChange={handleCollege2Change}
              className="w-full p-2 border rounded bg-white text-black"
            >
              <option value="">Select a college</option>
              {collegeOptions}
            </select>
          </div>

          <div className="mb-4">
            <label className="block">Course:</label>
            <select
              value={course1}
              onChange={handleCourseChange}
              className="w-full p-2 border rounded bg-white text-black"
            >
              <option value="">Select a course</option>
              {college1 && getCoursesForCollege(college1).map((course: Course) => (
                <option key={course.name} value={course.name}>
                  {course.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleCompare}
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-2 px-4 rounded-md font-bold transition duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-opacity-50 mr-4"
          >
            Compare
          </button>

          <button
            onClick={onClose}
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-2 px-4 rounded-md font-bold transition duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-opacity-50"
          >
            Close Sidebar
          </button>

        </div>
      ) : !comparisonData ? (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[425px] bg-white text-gray-800">
            <DialogHeader>
              <DialogTitle>Compare Colleges</DialogTitle>
            </DialogHeader>
            <div className="max-w-2xl mx-auto p-4">
              <div className="mb-4">
                <label className="block">College 1:</label>
                <select
                  value={college1}
                  onChange={handleCollege1Change}
                  className="w-full p-2 border rounded bg-white text-black"
                >
                  <option value="">Select a college</option>
                  {collegeOptions}
                </select>
              </div>

              <div className="mb-4">
                <label className="block">College 2:</label>
                <select
                  value={college2}
                  onChange={handleCollege2Change}
                  className="w-full p-2 border rounded bg-white text-black"
                >
                  <option value="">Select a college</option>
                  {collegeOptions}
                </select>
              </div>

              <div className="mb-4">
                <label className="block">Course:</label>
                <select
                  value={course1}
                  onChange={handleCourseChange}
                  className="w-full p-2 border rounded bg-white text-black"
                >
                  <option value="">Select a course</option>
                  {college1 && getCoursesForCollege(college1).map((course: Course) => (
                    <option key={course.name} value={course.name}>
                      {course.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleCompare}
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-2 px-4 rounded-md font-bold transition duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-opacity-50 w-full mb-2"
              >
                Compare
              </button>

              <button
                onClick={() => setIsDialogOpen(false)}
                className="bg-gray-200 text-gray-700 py-2 px-4 rounded-md font-bold transition duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-opacity-50 w-full"
              >
                Close
              </button>
            </div>
          </DialogContent>
        </Dialog>
      ) : (
        <Modal onClose={() => setComparisonData(null)}>
          <h3 className="text-xl font-bold mb-2 text-gray-800">Comparison Results:</h3>
          <div className="overflow-x-auto text-black overflow-y-scroll h-[600px]">
            <table className="min-w-full border border-gray-300 rounded-lg bg-white shadow-md overflow-x-auto">
              <thead className="bg-gray-200 text-gray-800">
                <tr>
                  <th className="border px-4 py-2">Parameter</th>
                  <th className="border px-4 text-black py-2">{college1}</th>
                  <th className="border px-4 text-black py-2">{college2}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {[
                  {
                    label: "Cutoff",
                    value1: comparisonData.college1.cutoff,
                    value2: comparisonData.college2.cutoff,
                  },
                  {
                    label: "Fees",
                    value1: comparisonData.college1.fees,
                    value2: comparisonData.college2.fees,
                  },
                  {
                    label: "Scholarship",
                    value1: comparisonData.college1.scholarship,
                    value2: comparisonData.college2.scholarship,
                  },
                  {
                    label: "Average Salary",
                    value1: comparisonData.college1.avg_salary,
                    value2: comparisonData.college2.avg_salary,
                  },
                  {
                    label: "Placement %",
                    value1: comparisonData.college1.placement_percentage,
                    value2: comparisonData.college2.placement_percentage,
                  }
                ].map((item) => (
                  <tr key={item.label}>
                    <td className="border px-4 py-2 font-semibold">{item.label}</td>
                    <td className="border px-4 py-2">{item.value1}</td>
                    <td className="border px-4 py-2">{item.value2}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            onClick={() => setComparisonData(null)}
            className="mt-4 bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300"
          >
            Close Comparison
          </button>
        </Modal>
      )}
    </>
  );
};

export default CollegeComparison;