import { defineConfig } from "vitepress";

export default defineConfig({
  title: "Grade-Forge",
  description:
    "Documentation for students, faculty, grading assistants, and university administrators.",
  base: "/docs/",

  themeConfig: {
    nav: [
      { text: "Home", link: "/" },
      { text: "Students", link: "/students/" },
      { text: "Faculty", link: "/faculty/" },
      { text: "Grading assistants", link: "/grading-assistants/" },
      { text: "University admin", link: "/university-admin/" },
    ],

    sidebar: [
      {
        text: "Getting started",
        items: [{ text: "Overview", link: "/" }],
      },
      {
        text: "Students",
        items: [{ text: "Student guide", link: "/students/" }],
      },
      {
        text: "Faculty",
        items: [{ text: "Faculty guide", link: "/faculty/" }],
      },
      {
        text: "Grading assistants",
        items: [{ text: "Grading assistant guide", link: "/grading-assistants/" }],
      },
      {
        text: "University administrators",
        items: [{ text: "University admin guide", link: "/university-admin/" }],
      },
    ],

    socialLinks: [],

    search: {
      provider: "local",
    },
  },
});
