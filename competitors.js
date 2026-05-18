const competitors = [
  {
    name: "Testlio",
    website: "https://testlio.com",
    blog: "https://testlio.com/blog",                          // ✅ works
    news: "https://testlio.com/news/",                         // ✅ fixed (was /press-resources/)
    linkedin: "https://www.linkedin.com/company/testlio",      // ✅
    resources: "https://testlio.com/blog/category/press-releases/", // ✅ fixed (was 404)
    events: "https://testlio.com/events",                      // ✅ works
  },
  {
    name: "QA Wolf",
    website: "https://www.qawolf.com",
    blog: "https://www.qawolf.com/blog",                       // ✅
    news: "https://www.qawolf.com/blog",                       // ✅ no separate newsroom
    linkedin: "https://www.linkedin.com/company/qa-wolf",      // ✅
    resources: "https://www.qawolf.com/guides",                // ✅
    events: "https://www.qawolf.com/webinars",                 // ✅
  },
  {
    name: "Qualitest",
    website: "https://www.qualitestgroup.com",
    blog: "https://www.qualitestgroup.com/insights/blog/",     // ✅
    news: "https://www.qualitestgroup.com/news-center/",       // ✅
    linkedin: "https://www.linkedin.com/company/qualitest-group", // ✅
    resources: "https://www.qualitestgroup.com/insights/",     // ✅
    events: "https://www.qualitestgroup.com/insights/events/", // ✅
  },
  {
    name: "Infosys BPM",
    website: "https://www.infosysbpm.com",
    blog: "https://www.infosysbpm.com/blogs.html",             // ✅
    news: "https://www.infosysbpm.com/newsroom/press-releases.html", // ✅
    linkedin: "https://www.linkedin.com/company/infosys-bpm",  // ✅
    resources: "https://www.infosysbpm.com/live-enterprise/blogs.html", // ✅
    events: "https://www.infosysbpm.com/newsroom/events.html", // ✅
  },
  {
    name: "Cigniti",
    website: "https://www.cigniti.com",
    blog: "https://www.cigniti.com/blog/",                     // ✅
    news: "https://www.cigniti.com/press-releases/",           // ✅
    linkedin: "https://www.linkedin.com/company/cigniti-technologies", // ✅
    resources: "https://www.cigniti.com/white-papers/",        // ✅
    events: "https://www.cigniti.com/events/",                 // ✅
  },
];

module.exports = competitors;