// mongo-init/mongo-init.js

print("========== Running Mongo init script ==========");

// 1) Connect to admin DB as root
db = db.getSiblingDB('admin');

// By default, if MONGO_INITDB_ROOT_USERNAME/PASSWORD are set,
// the init scripts run in an "unauthenticated" context but let
// you create the root user or do advanced operations. If you
// want to authenticate explicitly, you can do it, but in many
// official mongo images, it's not needed here.

// 2) Create additional users & DBs

// --- a) Admin user (already set by MONGO_INITDB_ROOT_... if you want to define them here, you can) ---
// db.createUser({
//   user:  "adminUser",
//   pwd:   "adminPassword123",
//   roles: [ { role: "root", db: "admin" } ]
// });

// --- b) Application DB + user
db = db.getSiblingDB("application-db");
db.createUser({
    user: "applicationDbAdmin",
    pwd: "appDbPass",
    roles: [
        { role: "dbOwner", db: "application-db" }
        // or "readWrite", "dbAdmin", etc. if needed
    ]
});

// --- c) Virtual DB + user
db = db.getSiblingDB("application-virtual-db");
db.createUser({
    user: "virtualDbManager",
    pwd: "virtualPass",
    roles: [
        { role: "dbOwner", db: "application-virtual-db" }
    ]
});

// done
print("========== Finished Mongo init script ==========");
