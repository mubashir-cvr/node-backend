const path = require("path");
const mongoose = require("mongoose");
const express = require("express");
const bodyParser = require("body-parser");
const User = require("./models/user");
const { Permission, Role } = require("./models/role");
const bcrypt = require('bcrypt');
const appRoutes = require("./routes/v1/index");
const app = express();

// app.use(bodyParser.urlencoded()); // x-www-form-urlencoded <form>
app.use(bodyParser.json()); // application/json

app.use("/images", express.static(path.join(__dirname, "images")));

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "OPTIONS, GET, POST, PUT, PATCH, DELETE"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

app.use("/api", appRoutes);

mongoose
  .connect(
    "mongodb://marjintechonline:mubashirjan24@ac-rap9dl6-shard-00-00.a1ijif0.mongodb.net:27017,ac-rap9dl6-shard-00-01.a1ijif0.mongodb.net:27017,ac-rap9dl6-shard-00-02.a1ijif0.mongodb.net:27017/pressMaster?ssl=true&replicaSet=atlas-14h2xo-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Cluster1"
  )
  .then(() => {
    console.log("Connected to MongoDB");
    const PORT = process.env.PORT || 3000; // Use environment variable PORT if available, otherwise use port 3000
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });

    // Check if allAccess permission exists, if not create it
    Permission.findOne({ name: "allAccess" })
      .then((permission) => {
        if (!permission) {
          permission = new Permission({
            name: "allAccess",
            description: "Full admin access",
          });
          return permission.save();
        }
        return permission;
      })
      .then((allAccessPermission) => {
        // Check if admin role exists, if not create it
        Role.findOne({ name: "admin" })
          .then((role) => {
            if (!role) {
              role = new Role({
                name: "admin",
                permissions: [allAccessPermission._id],
              });
              return role.save();
            }
            return role;
          })
          .then((adminRole) => {
            // Create superadmin user if not exists
            User.findOne({ email: "superadmin@gmail.com" })
              .then((user) => {
                if (!user) {
                  // Hash the password
                  bcrypt
                    .hash("superadmin", 12)
                    .then((hashedPassword) => {
                      // Create the superadmin user
                      const superadminUser = new User({
                        email: "superadmin@gmail.com",
                        password: hashedPassword,
                        name: "Super Admin",
                        role: adminRole._id,
                      });
                      return superadminUser.save();
                    })
                    .then(() => {
                      console.log("Superadmin user created successfully.");
                    })
                    .catch((err) => {
                      console.error(
                        "Error creating superadmin user:",
                        err
                      );
                    });
                } else {
                  console.log("Superadmin user already exists.");
                }
              })
              .catch((err) => {
                console.error(
                  "Error finding superadmin user:",
                  err
                );
              });
          })
          .catch((err) => {
            console.error("Error creating admin role:", err);
          });
      })
      .catch((err) => {
        console.error("Error creating allAccess permission:", err);
      });
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB:", err);
  });