import usersControllers from "./users.controllers.js";

export default function ({ api, event }) {
  const action = async (actionType, uid, count = 0) => {
    const controllers = usersControllers({ api });
    const users = await controllers.find(uid);

    if (!users.status) {
      return {
        status: false,
        data: "User information not found",
      };
    }

    switch (actionType) {
      case "increase": {
        var expIncrease = +users.data.data.exp + count;
        var currentLevel = +users.data.data.level;
        var levelUpExp = 100 + currentLevel * 50;
        let newLevel = currentLevel;

        while (expIncrease >= levelUpExp) {
          newLevel += 1;
          expIncrease -= levelUpExp;
          levelUpExp = 100 + newLevel * 50;
        }

        var updatedUser = await controllers.update(uid, { level: newLevel, exp: expIncrease });

        if (updatedUser.status) {
          if (newLevel > currentLevel) {
            return {
              status: "level_up",
              data: `User has leveled up to level ${newLevel}`,
            };
          } else {
            return {
              status: true,
              data: `User's experience increased by ${expIncrease}`,
            };
          }
        } else {
          return {
            status: false,
            data: "Error updating user information",
          };
        }
      }

      case "check": {
        const exp = +users.data.data.exp;
        const currentLevel = +users.data.data.level;
        const levelUpExp = 100 + currentLevel * 50;
        const expNeededForNextLevel = levelUpExp - exp;

        return {
          status: true,
          data: {
            currentLevel,
            exp,
            expNeededForNextLevel,
          },
        };
      }
      default:
        return {
          status: false,
          data: "Invalid action",
        };
    }
  };

  const increase = async (uid, count = 0) => {
    return await action("increase", uid, count);
  };

  const check = async (uid) => {
    return await action("check", uid);
  };

  return {
    increase,
    check,
  };
}
