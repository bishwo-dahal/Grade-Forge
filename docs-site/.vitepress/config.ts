import { defineConfig } from "vitepress";

export default defineConfig({
  title: "Grade-Forge",
  description:
    "Documentation for students, faculty, grading assistants, and university administrators.",
  base: "/docs/",

  themeConfig: {
    nav: [
      { text: "Home", link: "/" },
      { text: "Getting started", link: "/getting-started" },
      { text: "Students", link: "/students/" },
      { text: "Faculty", link: "/faculty/" },
      { text: "Grading assistants", link: "/grading-assistants/" },
      { text: "University admin", link: "/university-admin/" },
    ],

    sidebar: {
      "/": [
        {
          text: "Start",
          items: [
            { text: "Home", link: "/" },
            { text: "Getting started", link: "/getting-started" },
          ],
        },
        {
          text: "Guides by role",
          items: [
            { text: "Students", link: "/students/guide" },
            { text: "Faculty", link: "/faculty/guide" },
            { text: "Grading assistants", link: "/grading-assistants/guide" },
            { text: "University admin", link: "/university-admin/guide" },
          ],
        },
      ],
      "/getting-started": [
        {
          text: "Getting started",
          items: [{ text: "Overview", link: "/getting-started" }],
        },
      ],
      "/students/": [
        {
          text: "Students",
          items: [
            { text: "Overview", link: "/students/" },
            { text: "Student guide", link: "/students/guide" },
          ],
        },
      ],
      "/faculty/": [
        {
          text: "Faculty",
          items: [
            { text: "Overview", link: "/faculty/" },
            { text: "Faculty guide", link: "/faculty/guide" },
          ],
        },
      ],
      "/grading-assistants/": [
        {
          text: "Grading assistants",
          items: [
            { text: "Overview", link: "/grading-assistants/" },
            { text: "GA guide", link: "/grading-assistants/guide" },
          ],
        },
      ],
      "/university-admin/": [
        {
          text: "University admin",
          items: [
            { text: "Overview", link: "/university-admin/" },
            { text: "Admin guide", link: "/university-admin/guide" },
          ],
        },
      ],
    },

    socialLinks: [],

    search: {
      provider: "local",
    },
  },
});
