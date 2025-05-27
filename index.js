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
    const blogDatabase = client.db("blogDB");

    const usersCollection = userDatabase.collection("user");
    const coursesCollection = courseDatabase.collection("courses");
    const blogCollection = blogDatabase.collection("blog");

    // COURSES ENDPOINTS

    // GET - Get all courses (basic info only)
    // app.get("/courses", async (req, res) => {
    //   try {
    //     // Projection to return only essential fields
    //     const projection = {
    //       slug: 1,
    //       title: 1,

    //       fee: 1,
    //       duration: 1,
    //       session: 1,
    //       minimum_age: 1,
    //       _id: 0,
    //     };

    //     const courses = await coursesCollection
    //       .find({}, { projection })
    //       .toArray();

    //     res.json({
    //       success: true,
    //       count: courses.length,
    //       courses,
    //     });
    //   } catch (error) {
    //     console.error("Error fetching courses:", error);
    //     res.status(500).json({
    //       success: false,
    //       message: "Failed to fetch courses",
    //     });
    //   }
    // });
    app.post("/courses", async (req, res) => {
      try {
        const {
          title,
          slug,
          short_description,
          icon,
          bgColorClass,
          fee,
          duration,
          session,
          category,
          minimum_age,
          assessment,
          resultCertificate,
          earnings,
          siaLicenceFee,
          additionalCharges,
          entryRequirement,
          teachingMethod,
          content,
          faq,
          isFeatured,
          overview,
          imageUrl, // Added imageUrl from Cloudinary
        } = req.body;

        // Basic validation
        if (
          !title ||
          !slug ||
          fee === undefined ||
          isNaN(fee) ||
          !duration ||
          !session ||
          minimum_age === undefined ||
          isNaN(minimum_age) ||
          !category ||
          !bgColorClass ||
          !overview
        ) {
          return res.status(400).json({
            success: false,
            message: "Missing or invalid required fields.",
          });
        }

        const courseData = {
          title,
          slug,
          icon,
          short_description,
          bgColorClass,
          fee: parseFloat(fee),
          duration,
          session,
          category,
          minimum_age: parseInt(minimum_age),
          assessment: assessment || "",
          resultCertificate: resultCertificate || "",
          earnings: earnings || "",
          siaLicenceFee: siaLicenceFee || "",
          additionalCharges: additionalCharges || "",
          entryRequirement: entryRequirement || "",
          teachingMethod: teachingMethod || "",
          overview, // Added overview field
          content: content || [],
          faq: faq || [],
          isFeatured: isFeatured || false,
          imageUrl: imageUrl || "", // Store the Cloudinary image URL
          createdAt: new Date(),
        };

        const result = await coursesCollection.insertOne(courseData);

        res.status(201).json({
          success: true,
          message: "Course created successfully",
          insertedId: result.insertedId,
        });
      } catch (error) {
        console.error("Error creating course:", error);
        res.status(500).json({
          success: false,
          message: "Failed to create course",
          error: error.message,
        });
      }
    });

    // GET endpoint for fetching all courses
    app.get("/courses", async (req, res) => {
      try {
        const courses = await coursesCollection.find({}).toArray();
        res.status(200).json({
          success: true,
          courses,
          message: "Courses fetched successfully",
        });
      } catch (error) {
        console.error("Error fetching courses:", error);
        res.status(500).json({
          success: false,
          message: "Failed to fetch courses",
          error: error.message,
        });
      }
    });
    // PUT - Update a course by slug
    app.put("/courses/:slug", async (req, res) => {
      try {
        const slug = req.params.slug;
        const updateData = req.body;

        if (!slug) {
          return res.status(400).json({
            success: false,
            message: "Course slug is required",
          });
        }

        const result = await coursesCollection.updateOne(
          { slug: slug },
          { $set: updateData }
        );

        if (result.matchedCount === 0) {
          return res.status(404).json({
            success: false,
            message: "Course not found",
          });
        }

        res.json({
          success: true,
          message: "Course updated successfully",
        });
      } catch (error) {
        console.error("Error updating course:", error);
        res.status(500).json({
          success: false,
          message: "Failed to update course",
        });
      }
    });

    // DELETE - Delete a course by slug
    app.delete("/courses/:slug", async (req, res) => {
      try {
        const slug = req.params.slug;

        if (!slug) {
          return res.status(400).json({
            success: false,
            message: "Course slug is required",
          });
        }

        const result = await coursesCollection.deleteOne({ slug });

        if (result.deletedCount === 0) {
          return res.status(404).json({
            success: false,
            message: "Course not found",
          });
        }

        res.json({
          success: true,
          message: "Course deleted successfully",
        });
      } catch (error) {
        console.error("Error deleting course:", error);
        res.status(500).json({
          success: false,
          message: "Failed to delete course",
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
          short_description: course.short_description,
          fee: course.fee || "Not specified",
          icon: course.icon,
          duration: course.duration,
          session: course.session,
          category: course.category,
          session: course.session,
          assessment: course.assessment,
          result_certificate: course.result_certificate,
          minimum_age: course.minimum_age,
          earnings: course.earnings || "Not specified",
          siaLicenceFee: course.siaLicenceFee || "Not specified",
          additionalCharges: course.additionalCharges || "None",
          faq: course.faq || [],
          entryRequirement: course.entryRequirement || "None specified",
          teachingMethod: course.teachingMethod || "Not specified",
          overview: course.overview,
          content: course.content || [],
          imageUrl: course.imageUrl,
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

    //BLOG SECTION START

    app.post("/blogs", async (req, res) => {
      try {
        const {
          title,
          slug,
          metaDescription,
          content,
          category,
          tags,
          author,
        } = req.body;

        // Validate required fields
        if (!title || !slug || !content || !category || !tags || !author) {
          return res.status(400).json({ error: "All fields are required" });
        }

        const publishDate = new Date();
        const result = await blogCollection.insertOne({
          title,
          slug,
          metaDescription,
          content,
          category,
          tags: Array.isArray(tags)
            ? tags
            : tags.split(",").map((tag) => tag.trim()),
          publishDate,
          author,
          views: 0,
          updatedAt: null,
        });

        res.status(201).json(result);
      } catch (error) {
        console.error("Error creating blog:", error);
        res.status(500).json({ error: error.message });
      }
    });

    // Update blog post
    app.put("/blogs/:slug", async (req, res) => {
      try {
        const { slug } = req.params;
        const { title, metaDescription, content, category, tags, author } =
          req.body;

        // Validate required fields
        if (!title || !content || !category || !tags || !author) {
          return res
            .status(400)
            .json({ error: "All fields except slug are required" });
        }

        const result = await blogCollection.updateOne(
          { slug },
          {
            $set: {
              title,
              metaDescription,
              content,
              category,
              tags: Array.isArray(tags)
                ? tags
                : tags.split(",").map((tag) => tag.trim()),
              author,
              updatedAt: new Date(),
            },
          }
        );

        if (result.matchedCount === 0) {
          return res.status(404).json({ error: "Blog post not found" });
        }

        res.json(result);
      } catch (error) {
        console.error("Error updating blog:", error);
        res.status(500).json({ error: error.message });
      }
    });

    // Get all blogs
    app.get("/blogs", async (req, res) => {
      try {
        const blogs = await blogCollection
          .find()
          .sort({ publishDate: -1 })
          .toArray();
        res.json(blogs);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Get single blog by slug
    app.get("/blogs/:slug", async (req, res) => {
      try {
        const blog = await blogCollection.findOne({ slug: req.params.slug });
        if (!blog) return res.status(404).json({ message: "Blog not found" });

        // Increment views
        await blogCollection.updateOne(
          { slug: req.params.slug },
          { $inc: { views: 1 } }
        );

        res.json(blog);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Update blog
    // app.put("/blogs/:slug", async (req, res) => {
    //   try {
    //     const { title, metaDescription, content, category, tags } = req.body;

    //     const result = await blogCollection.updateOne(
    //       { slug: req.params.slug },
    //       {
    //         $set: {
    //           title,
    //           metaDescription,
    //           content,
    //           category,
    //           tags: tags.split(",").map((tag) => tag.trim()),
    //           updatedAt: new Date(),
    //         },
    //       }
    //     );

    //     if (result.matchedCount === 0) {
    //       return res.status(404).json({ message: "Blog not found" });
    //     }

    //     res.json(result);
    //   } catch (error) {
    //     res.status(500).json({ error: error.message });
    //   }
    // });

    // Delete blog
    app.delete("/blogs/:slug", async (req, res) => {
      try {
        const result = await blogCollection.deleteOne({
          slug: req.params.slug,
        });
        if (result.deletedCount === 0) {
          return res.status(404).json({ message: "Blog not found" });
        }
        res.json({ message: "Blog deleted successfully" });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    //BLOG SECTION END

    // app.post("/courses", async (req, res) => {
    //   try {
    //     const {
    //       title,
    //       slug,
    //       fee,
    //       duration,
    //       session,
    //       minimum_age,
    //       assessment,
    //       resultCertificate,
    //       earnings,
    //       siaLicenceFee,
    //       additionalCharges,
    //       entryRequirement,
    //       teachingMethod,
    //       content,
    //       faq,
    //     } = req.body;

    //     // Optional: Basic validation
    //     if (!title || !slug || !fee || !duration || !session || !minimum_age) {
    //       return res.status(400).json({
    //         success: false,
    //         message: "Missing required fields",
    //       });
    //     }

    //     const courseData = {
    //       title,
    //       slug,
    //       fee,
    //       duration,
    //       session,
    //       minimum_age,
    //       assessment,
    //       resultCertificate,
    //       earnings,
    //       siaLicenceFee,
    //       additionalCharges,
    //       entryRequirement,
    //       teachingMethod,
    //       content,
    //       faq,
    //       createdAt: new Date(),
    //     };

    //     const result = await coursesCollection.insertOne(courseData);

    //     res.status(201).json({
    //       success: true,
    //       message: "Course created successfully",
    //       insertedId: result.insertedId,
    //     });
    //   } catch (error) {
    //     console.error("Error creating course:", error);
    //     res.status(500).json({
    //       success: false,
    //       message: "Failed to create course",
    //     });
    //   }
    // });

    // app.post("/courses", async (req, res) => {
    //   try {
    //     const {
    //       title,
    //       slug,
    //       icon,
    //       bgColorClass,
    //       fee,
    //       duration,
    //       session,
    //       category,
    //       minimum_age,
    //       assessment,
    //       resultCertificate,
    //       earnings,
    //       siaLicenceFee,
    //       additionalCharges,
    //       entryRequirement,
    //       teachingMethod,
    //       content,
    //       faq,
    //     } = req.body;

    //     // Optional: Basic validation
    //     if (
    //       !title ||
    //       !slug ||
    //       !fee ||
    //       !duration ||
    //       !session ||
    //       !minimum_age ||
    //       !category ||
    //       !bgColorClass
    //     ) {
    //       return res.status(400).json({
    //         success: false,
    //         message: "Missing required fields",
    //       });
    //     }

    //     const courseData = {
    //       title,
    //       slug,
    //       icon,
    //       bgColorClass,
    //       fee,
    //       duration,
    //       session,
    //       category,
    //       minimum_age,
    //       assessment,
    //       resultCertificate,
    //       earnings,
    //       siaLicenceFee,
    //       additionalCharges,
    //       entryRequirement,
    //       teachingMethod,
    //       content,
    //       faq,
    //       createdAt: new Date(),
    //     };

    //     const result = await coursesCollection.insertOne(courseData);

    //     res.status(201).json({
    //       success: true,
    //       message: "Course created successfully",
    //       insertedId: result.insertedId,
    //     });
    //   } catch (error) {
    //     console.error("Error creating course:", error);
    //     res.status(500).json({
    //       success: false,
    //       message: "Failed to create course",
    //       error: error.message,
    //     });
    //   }
    // });

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
