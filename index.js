const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const port = process.env.PORT || 5000;

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.p41fucv.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();
    const userDatabase = client.db("security-course-user");
    const courseDatabase = client.db("coursesDB");

    const usersCollection = userDatabase.collection("user");
    const coursesCollection = courseDatabase.collection("courses");

    // COURSES ENDPOINTS

    // GET - Get all courses (basic info only)
    app.get("/courses", async (req, res) => {
      try {
        // Projection to return only essential fields
        const projection = {
          slug: 1,
          title: 1,
          fee: 1,
          duration: 1,
          session: 1,
          minimum_age: 1,
          _id: 0,
        };

        const courses = await coursesCollection
          .find({}, { projection })
          .toArray();

        res.json({
          success: true,
          count: courses.length,
          courses,
        });
      } catch (error) {
        console.error("Error fetching courses:", error);
        res.status(500).json({
          success: false,
          message: "Failed to fetch courses",
        });
      }
    });

    // GET - Get full course details by slug
    app.get("/courses/:slug", async (req, res) => {
      try {
        const slug = req.params.slug;

        if (!slug) {
          return res.status(400).json({
            success: false,
            message: "Course slug is required",
          });
        }

        const course = await coursesCollection.findOne({ slug });

        if (!course) {
          return res.status(404).json({
            success: false,
            message: "Course not found",
          });
        }

        // Format response with consistent structure
        const response = {
          slug: course.slug,
          title: course.title,
          fee: course.fee || "Not specified",
          duration: course.duration,
          session: course.session,
          assessment: course.assessment,
          result_certificate: course.result_certificate,
          minimum_age: course.minimum_age,
          earnings: course.earnings || "Not specified",
          sia_licence_fee: course.sia_licence_fee || "Not applicable",
          additional_charges: course.additional_charges || "None",
          faq: course.faq || [],
          entry_requirement: course.entry_requirement || "None specified",
          teaching_method: course.teaching_method,
          content: course.content || [],
        };

        res.json({
          success: true,
          course: response,
        });
      } catch (error) {
        console.error("Error fetching course:", error);
        res.status(500).json({
          success: false,
          message: "Failed to fetch course details",
        });
      }
    });

    // GET - Get all unique course slugs (for navigation)
    app.get("/courses/slugs", async (req, res) => {
      try {
        const slugs = await coursesCollection.distinct("slug");

        res.json({
          success: true,
          count: slugs.length,
          slugs,
        });
      } catch (error) {
        console.error("Error fetching slugs:", error);
        res.status(500).json({
          success: false,
          message: "Failed to fetch course slugs",
        });
      }
    });
    // POST - Register new user with confirm password validation
    app.post("/register", async (req, res) => {
      try {
        const { name, email, password, confirmPassword } = req.body;

        // Validation
        if (!name || !email || !password || !confirmPassword) {
          return res.status(400).json({
            success: false,
            message: "All fields are required",
          });
        }

        if (password !== confirmPassword) {
          return res.status(400).json({
            success: false,
            message: "Passwords do not match",
          });
        }

        if (password.length < 6) {
          return res.status(400).json({
            success: false,
            message: "Password must be at least 6 characters",
          });
        }

        // Check if user already exists
        const existingUser = await usersCollection.findOne({ email });
        if (existingUser) {
          return res.status(400).json({
            success: false,
            message: "Email already registered",
          });
        }

        // Create new user (in real app, hash password here)
        const newUser = {
          name,
          email,
          password, // In production, hash this password before saving
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const result = await usersCollection.insertOne(newUser);

        // Return user data without password
        const userResponse = {
          _id: result.insertedId,
          name: newUser.name,
          email: newUser.email,
          createdAt: newUser.createdAt,
        };

        res.status(201).json({
          success: true,
          message: "Registration successful",
          user: userResponse,
        });
      } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({
          success: false,
          message: "Internal server error",
        });
      }
    });

    // GET - Get user profile by email
    // Get user profile
    // Get user profile endpoint
    app.post("/login", async (req, res) => {
      try {
        const { email, password } = req.body;

        if (!email || !password) {
          return res.status(400).json({
            success: false,
            message: "Email and password are required",
          });
        }

        const user = await usersCollection.findOne({ email });
        if (!user) {
          return res.status(401).json({
            success: false,
            message: "Invalid credentials",
          });
        }

        // Simple comparison for now - replace with bcrypt in production
        if (password !== user.password) {
          return res.status(401).json({
            success: false,
            message: "Invalid credentials",
          });
        }

        // Return success with user data
        res.json({
          success: true,
          message: "Login successful",
          user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            createdAt: user.createdAt,
          },
          // Include this when you implement JWT:
          // token: jwt.sign({ email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' })
        });
      } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({
          success: false,
          message: "Server error during login",
        });
      }
    });

    // Get user profile
    // Get user data endpoint
    app.get("/users/:email", async (req, res) => {
      try {
        const email = req.params.email;
        const user = await usersCollection.findOne(
          { email },
          { projection: { password: 0 } } // Exclude password
        );

        if (!user) {
          return res.status(404).json({
            success: false,
            message: "User not found",
          });
        }

        res.json({
          success: true,
          user,
        });
      } catch (error) {
        console.error("Error fetching user:", error);
        res.status(500).json({
          success: false,
          message: "Server error",
        });
      }
    });

    app.post("/enroll", async (req, res) => {
      try {
        const { userEmail, courseSlug, phone, location, date } = req.body; // Changed from number to phone

        // Validation
        if (!userEmail || !courseSlug) {
          return res.status(400).json({
            success: false,
            message: "User email and course slug are required",
          });
        }

        // Find user and course
        const [user, course] = await Promise.all([
          usersCollection.findOne({ email: userEmail }),
          coursesCollection.findOne({ slug: courseSlug }),
        ]);

        if (!user) {
          return res.status(404).json({
            success: false,
            message: "User not found",
          });
        }

        if (!course) {
          return res.status(404).json({
            success: false,
            message: "Course not found",
          });
        }

        // Check if already enrolled
        const alreadyEnrolled = user.courses?.some(
          (c) => c.slug === courseSlug
        );
        if (alreadyEnrolled) {
          return res.status(400).json({
            success: false,
            message: "Already enrolled in this course",
          });
        }

        // Create enrollment record
        const enrollment = {
          slug: courseSlug,
          title: course.title,
          phone: phone, // Changed from number to phone
          enrolledAt: new Date(),
          location: location || null,
          date: date ? new Date(date) : null,
          completed: false,
        };

        // Update user document
        const result = await usersCollection.updateOne(
          { email: userEmail },
          {
            $push: { courses: enrollment },
            $set: { updatedAt: new Date() },
          }
        );

        if (result.modifiedCount === 1) {
          res.json({
            success: true,
            message: "Successfully enrolled in course",
            enrollment,
          });
        } else {
          throw new Error("Failed to update user record");
        }
      } catch (error) {
        console.error("Enrollment error:", error);
        res.status(500).json({
          success: false,
          message: "Failed to enroll in course",
        });
      }
    });

    app.get("/users/:email/courses", async (req, res) => {
      try {
        const email = req.params.email;
        const token = req.headers.authorization?.split(" ")[1];

        if (!token) {
          return res.status(401).json({
            success: false,

            message: "Authorization required",
          });
        }

        const user = await usersCollection.findOne(
          { email },
          { projection: { courses: 1 } }
        );

        if (!user) {
          return res.status(404).json({
            success: false,
            message: "User not found",
          });
        }

        res.json({
          success: true,
          courses: user.courses || [],
        });
      } catch (error) {
        console.error("Error fetching user courses:", error);
        res.status(500).json({
          success: false,
          message: "Failed to fetch user courses",
        });
      }
    });

    // Add this to your server.js file

    // Admin endpoints
    app.get("/admin/users", async (req, res) => {
      try {
        // In production, you should implement proper JWT authentication for admin
        const users = await usersCollection
          .find(
            {},
            {
              projection: {
                password: 0, // Exclude password
              },
            }
          )
          .sort({ createdAt: -1 })
          .toArray();

        res.json({
          success: true,
          users,
        });
      } catch (error) {
        console.error("Admin users fetch error:", error);
        res.status(500).json({
          success: false,
          message: "Failed to fetch users",
        });
      }
    });

    // Add this endpoint to mark courses as completed
    app.patch(
      "/admin/users/:userId/courses/:courseId/complete",
      async (req, res) => {
        try {
          const { userId, courseId } = req.params;

          // Verify admin - in production use proper JWT verification
          if (
            !req.headers.authorization ||
            req.headers.authorization !== `Bearer ${process.env.ADMIN_SECRET}`
          ) {
            return res.status(403).json({
              success: false,
              message: "Unauthorized",
            });
          }

          const result = await usersCollection.updateOne(
            {
              _id: new ObjectId(userId),
              "courses._id": new ObjectId(courseId),
            },
            {
              $set: {
                "courses.$.completed": true,
                "courses.$.completedAt": new Date(),
              },
            }
          );

          if (result.modifiedCount === 0) {
            return res.status(404).json({
              success: false,
              message: "User or course not found",
            });
          }

          res.json({
            success: true,
            message: "Course marked as completed",
          });
        } catch (error) {
          console.error("Complete course error:", error);
          res.status(500).json({
            success: false,
            message: "Failed to update course status",
          });
        }
      }
    );

    console.log("Successfully connected to MongoDB!");
  } finally {
    // Client will stay connected
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Course enrollment server is running");
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
