import { defineConfig } from "vitepress";

export default defineConfig({
  title: "Grade-Forge",
  description: "User manual for students, faculty, grading assistants, and university administrators.",
  base: "/docs/",

  themeConfig: {
    nav: [
      { text: "Home", link: "/" },
      { text: "Manual overview", link: "/manual/overview" },
      { text: "All actions", link: "/manual/actions/" },
      { text: "Who can do what", link: "/manual/roles-and-permissions" },
      { text: "FAQ", link: "/manual/faq" },
      { text: "For developers", link: "/manual/for-developers" },
    ],

    sidebar: {
      "/": [
        {
          text: "User manual",
          items: [
            { text: "Overview", link: "/manual/overview" },
            { text: "URLs and paths", link: "/manual/conventions" },
            { text: "Lifecycle", link: "/manual/lifecycle" },
            { text: "All actions", link: "/manual/actions/" },
            { text: "Who can do what", link: "/manual/roles-and-permissions" },
          ],
        },
        {
          text: "By role",
          items: [
            { text: "Student", link: "/manual/roles/student" },
            { text: "Faculty", link: "/manual/roles/faculty" },
            { text: "Grading assistant", link: "/manual/roles/grading-assistant" },
            { text: "University admin", link: "/manual/roles/university-admin" },
          ],
        },
        {
          text: "Features",
          items: [
            { text: "Sign-in and account", link: "/manual/features/sign-in-and-account" },
            { text: "Courses and classes", link: "/manual/features/courses-and-classes" },
            { text: "Assignments and editor", link: "/manual/features/assignments-and-editor" },
            { text: "Tests and submissions", link: "/manual/features/tests-and-submissions" },
            { text: "Grading and feedback", link: "/manual/features/grading-and-feedback" },
            { text: "Rubrics and groups", link: "/manual/features/rubrics-and-groups" },
            { text: "Grading assistants", link: "/manual/features/grading-assistants" },
            { text: "Plagiarism and AI", link: "/manual/features/plagiarism-and-ai-reports" },
            { text: "University administration", link: "/manual/features/university-administration" },
            { text: "Calendar, materials, discussions", link: "/manual/features/calendar-materials-discussions" },
            { text: "Files and downloads", link: "/manual/features/files-and-downloads" },
          ],
        },
        {
          text: "Help",
          items: [
            { text: "FAQ", link: "/manual/faq" },
            { text: "Glossary", link: "/manual/glossary" },
          ],
        },
        {
          text: "Developers",
          items: [{ text: "API and repo", link: "/manual/for-developers" }],
        },
      ],
      "/manual/": [
        {
          text: "Manual",
          items: [
            { text: "Overview", link: "/manual/overview" },
            { text: "URLs and paths", link: "/manual/conventions" },
            { text: "Lifecycle", link: "/manual/lifecycle" },
          ],
        },
        {
          text: "Find tasks",
          items: [
            { text: "All actions", link: "/manual/actions/" },
            { text: "Who can do what", link: "/manual/roles-and-permissions" },
          ],
        },
        {
          text: "By role",
          items: [
            { text: "Student", link: "/manual/roles/student" },
            { text: "Faculty", link: "/manual/roles/faculty" },
            { text: "Grading assistant", link: "/manual/roles/grading-assistant" },
            { text: "University admin", link: "/manual/roles/university-admin" },
          ],
        },
        {
          text: "Features",
          items: [
            { text: "Sign-in and account", link: "/manual/features/sign-in-and-account" },
            { text: "Courses and classes", link: "/manual/features/courses-and-classes" },
            { text: "Assignments and editor", link: "/manual/features/assignments-and-editor" },
            { text: "Tests and submissions", link: "/manual/features/tests-and-submissions" },
            { text: "Grading and feedback", link: "/manual/features/grading-and-feedback" },
            { text: "Rubrics and groups", link: "/manual/features/rubrics-and-groups" },
            { text: "Grading assistants", link: "/manual/features/grading-assistants" },
            { text: "Plagiarism and AI", link: "/manual/features/plagiarism-and-ai-reports" },
            { text: "University administration", link: "/manual/features/university-administration" },
            { text: "Calendar, materials, discussions", link: "/manual/features/calendar-materials-discussions" },
            { text: "Files and downloads", link: "/manual/features/files-and-downloads" },
          ],
        },
        {
          text: "Help",
          items: [
            { text: "FAQ", link: "/manual/faq" },
            { text: "Glossary", link: "/manual/glossary" },
          ],
        },
        {
          text: "Developers",
          items: [{ text: "API and repo", link: "/manual/for-developers" }],
        },
      ],
    },

    socialLinks: [],

    search: {
      provider: "local",
    },
  },
});
