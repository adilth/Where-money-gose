const bcrypt = require("bcrypt");
const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  userName: { type: String, unique: true, require: true },
  email: { type: String, unique: true, require: true },
  password: { type: String, require: true },
});

// Password hash middleware.

UserSchema.pre("save", function save(next) {
  const user = this;
  if (!user.isModified("password")) {
    return next();
  }
  bcrypt.genSalt(10, (err, salt) => {
    if (err) {
      return next(err);
    }
    bcrypt.hash(user.password, salt, (err, hash) => {
      if (err) {
        return next(err);
      }
      user.password = hash;
      next();
    });
  });
});

// Helper method for validating user's password.

UserSchema.methods.comparePassword = function comparePassword(
  candidatePassword,
  cb
) {
  bcrypt.compare(candidatePassword, this.password, (err, isMatch) => {
    cb(err, isMatch);
  });
};
// UserSchema.methods.changePassword = function (oldPassword, newPassword, cb) {
//   if (!oldPassword || !newPassword) {
//     return cb(
//       new errors.MissingPasswordError(
//         options.errorMessages.MissingPasswordError
//       )
//     );
//   }

//   var self = this;

//   this.authenticate(oldPassword, function (err, authenticated) {
//     if (err) {
//       return cb(err);
//     }

//     if (!authenticated) {
//       return cb(
//         new errors.IncorrectPasswordError(
//           options.errorMessages.IncorrectPasswordError
//         )
//       );
//     }

//     self.setPassword(newPassword, function (setPasswordErr, user) {
//       if (setPasswordErr) {
//         return cb(setPasswordErr);
//       }

//       self.save(function (saveErr) {
//         if (saveErr) {
//           return cb(saveErr);
//         }

//         cb(null, user);
//       });
//     });
//   });
// };

module.exports = mongoose.model("User", UserSchema);
