const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const pdfParse = require("pdf-parse");

const PORT = process.env.PORT || 5000;

const app = express();
//Middleware
app.use(cors());
app.use(express.json());

const upload = multer({dest: "uploads/"});

// sample skillset
const skillsDB = [
  "javascript",
  "react",
  "node",
  "express",
  "mongodb",
  "python",
  "java",
  "c++",
  "html",
  "css",
  "sql",
];

//skill extraction
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function extractSkills(text) {
  const lowerText = (text || "").toLowerCase();
  const found = new Set();

  for (const [canonicalSkill, aliases] of Object.entries(skillAliases)) {
    for (const alias of aliases) {
      const pattern = new RegExp(
        `\\b${escapeRegex(alias.toLowerCase())}\\b`,
        "i",
      );
      if (pattern.test(lowerText)) {
        found.add(canonicalSkill);
        break;
      }
    }
  }

  return [...found];
}

//roles
const roleSkills = {
  frontend: [
    "javascript",
    "typescript",
    "react",
    "html",
    "css",
    "api",
    "git",
    "testing",
  ],
  backend: ["node", "express", "database", "api", "auth", "git", "docker"],
  aiml: [
    "python",
    "pandas",
    "numpy",
    "scikit-learn",
    "tensorflow",
    "pytorch",
    "machine learning",
    "deep learning",
    "nlp",
    "computer vision",
  ],
  system_design: [
    "system_design",
    "database",
    "aws",
    "docker",
    "kubernetes",
    "ci_cd",
    "caching",
    "load balancing",
    "microservices",
    "scalability",
  ],
  full_stack: [
    "frontend",
    "backend",
    "react",
    "node",
    "express",
    "database",
    "api",
    "auth",
  ],
  devops: [
    "linux",
    "docker",
    "kubernetes",
    "aws",
    "ci_cd",
    "git",
    "monitoring",
  ],
  data: [
    "sql",
    "python",
    "pandas",
    "numpy",
    "data analysis",
    "data visualization",
    "tableau",
    "power bi",
  ],
};

//covering all aliasese of all the skills
const skillAliases = {
  javascript: ["javascript", "js", "es6", "es7", "ecmascript"],
  typescript: ["typescript", "ts"],
  react: ["react", "react.js", "reactjs", "next.js", "nextjs"],
  angular: ["angular", "angularjs"],
  vue: ["vue", "vue.js", "vuejs"],
  node: ["node", "node.js", "nodejs"],
  express: ["express", "express.js", "expressjs"],
  html: ["html", "html5"],
  css: ["css", "css3", "tailwind", "bootstrap", "sass", "scss"],
  git: ["git", "github", "gitlab"],
  testing: [
    "jest",
    "mocha",
    "chai",
    "cypress",
    "selenium",
    "unit testing",
    "integration testing",
  ],
  api: ["rest", "rest api", "api", "graphql", "axios", "fetch"],
  database: [
    "sql",
    "mysql",
    "postgres",
    "postgresql",
    "mongodb",
    "mongoose",
    "sqlite",
    "redis",
  ],
  auth: [
    "jwt",
    "authentication",
    "authorization",
    "oauth",
    "oauth2",
    "passport",
  ],
  docker: ["docker", "container", "containers"],
  kubernetes: ["kubernetes", "k8s"],
  aws: ["aws", "ec2", "s3", "lambda", "cloudwatch", "route53"],
  ci_cd: [
    "ci/cd",
    "cicd",
    "github actions",
    "jenkins",
    "gitlab ci",
    "github workflows",
  ],
  linux: ["linux", "ubuntu", "shell", "bash"],
  system_design: [
    "system design",
    "scalability",
    "load balancing",
    "caching",
    "microservices",
    "distributed systems",
    "high availability",
    "fault tolerance",
    "sharding",
    "replication",
    "rate limiting",
  ],
  aiml: [
    "python",
    "pandas",
    "numpy",
    "matplotlib",
    "seaborn",
    "scikit-learn",
    "sklearn",
    "tensorflow",
    "keras",
    "pytorch",
    "machine learning",
    "deep learning",
    "nlp",
    "computer vision",
    "data preprocessing",
    "feature engineering",
    "model training",
    "model evaluation",
  ],
  data: [
    "sql",
    "excel",
    "tableau",
    "power bi",
    "pandas",
    "numpy",
    "data analysis",
    "data visualization",
    "etl",
    "dashboard",
  ],
  communication: [
    "communication",
    "teamwork",
    "problem solving",
    "leadership",
    "collaboration",
  ],
};

//matching
function analyze(resumeSkills, role) {
  const required = roleSkills[role] || [];

  const matched = resumeSkills.filter((skill) => required.includes(skill));
  const missing = required.filter((skill) => !resumeSkills.includes(skill));

  const matchPercentage =
    required.length === 0
      ? 0
      : Math.round((matched.length / required.length) * 100);

  return {
    matchPercentage,
    matched,
    missing,
  };
}

//Test route
app.get("/", (req, res) => {
  res.send("Backend is running");
});

//analyzing
app.post("/analyze", upload.single("resume"), async (req, res) => {
  try {
    const filepath = req.file.path;
    const databuffer = await fs.readFileSync(filepath);
    const pdfData = await pdfParse(databuffer);

    const text = await pdfData.text;
    if (!text) {
      res.json({error: "no text found "});
    }
    const resumeSkills = await extractSkills(text);
    const result = await analyze(resumeSkills, req.body.role);
    console.log("TEXT:", text);
    res.json({
      ...result,
      extractedSkills: resumeSkills,
      role: req.body.role,
    });
  } catch (err) {
    console.error("error parsing : ", err);
    res.status(500).json({
      error: "Processing failed",
    });
  }
});

//Start the Server
app.listen(PORT, () => {
  console.log("server is liveon port ",PORT);
});
