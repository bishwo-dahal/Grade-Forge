import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import type { GradingAssistantCourseResponse } from "../../types/gradingAssistantCourse";
import { listGradingAssistantCourses } from "../../services/gradingAssistantCourseService";
import { clearAuthenticated } from "../auth";
import { buildLogoutConfirmationMessage, queueAuthNotification } from "../authNotifications";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { GradingAssistantCourseCard } from "./gradingAssistant/GradingAssistantCourseCard";

export function GradingAssistantMain() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<GradingAssistantCourseResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);

  useEffect(() => {
    listGradingAssistantCourses()
      .then(setCourses)
      .catch(() => setCourses([]))
      .finally(() => setIsLoading(false));
  }, []);

  const handleConfirmLogout = () => {
    queueAuthNotification(buildLogoutConfirmationMessage("gradingAssistant"));
    setIsLogoutDialogOpen(false);
    clearAuthenticated();
    navigate("/signin", { replace: true });
  };

  return (
    <main className="flex-1 overflow-y-auto bg-[#F5F2F2]">
      <div className="max-w-7xl mx-auto px-8 py-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-[#2B2A2A]">My Assigned Courses</h2>
          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={() => setIsLogoutDialogOpen(true)}
              className="text-[13px] font-medium text-[#5D667A] underline-offset-2 hover:text-[#7A1226] hover:underline"
            >
              Log out
            </button>
            <Link
              to="/grading-assistant/courses"
              className="text-[13px] font-medium text-[#5A7ACD] hover:text-[#4a6abd]"
            >
              View All Courses &rarr;
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {isLoading
            ? Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={`ga-course-skeleton-${index}`}
                  className="block bg-white rounded-2xl p-6 border border-gray-200 animate-pulse"
                >
                  <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 bg-[#EEF3FF] rounded-xl flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="h-3 w-16 rounded bg-gray-200 mb-2" />
                    <div className="h-4 w-44 max-w-full rounded bg-gray-200" />
                  </div>
                  </div>
                  <div className="space-y-3">
                    <div className="h-3 w-28 rounded bg-gray-200" />
                    <div className="h-3 w-32 rounded bg-gray-200" />
                  </div>
                  <div className="mt-5 w-full h-10 bg-gray-100 rounded-lg" />
                </div>
              ))
            : courses.slice(0, 6).map((course) => (
                <GradingAssistantCourseCard key={course.id} course={course} />
              ))}
        </div>
        {!isLoading && courses.length === 0 && (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-8 text-center">
            <p className="text-[13px] text-gray-600">
              You are not assigned to any courses yet. Contact your faculty to be added as a grading assistant.
            </p>
          </div>
        )}
      </div>
      <AlertDialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm logout</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to log out from this account?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 focus-visible:ring-red-600"
              onClick={handleConfirmLogout}
            >
              Log out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
