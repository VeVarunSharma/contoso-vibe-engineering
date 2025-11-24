import { db } from "./index.js";
import { users, groups, groupMembers, projects } from "./schema.js";
import { faker } from "@faker-js/faker";

async function seed() {
  console.log("Seeding database...");

  try {
    // Clear existing data
    console.log("Clearing existing data...");
    await db.delete(projects);
    await db.delete(groupMembers);
    await db.delete(groups);
    await db.delete(users);

    // Generate Users
    console.log("Generating users...");
    const userIds: number[] = [];
    for (let i = 0; i < 50; i++) {
      const [user] = await db
        .insert(users)
        .values({
          name: faker.person.fullName(),
          email: faker.internet.email(),
        })
        .returning({ id: users.id });
      if (user) {
        userIds.push(user.id);
      }
    }

    // Generate Groups
    console.log("Generating groups...");
    const groupIds: number[] = [];
    for (let i = 0; i < 10; i++) {
      const [group] = await db
        .insert(groups)
        .values({
          name: faker.company.name() + " Team",
          description: faker.company.catchPhrase(),
        })
        .returning({ id: groups.id });
      if (group) {
        groupIds.push(group.id);

        // Generate Projects for this Group
        const numProjects = faker.number.int({ min: 1, max: 5 });
        for (let j = 0; j < numProjects; j++) {
          await db.insert(projects).values({
            name: faker.commerce.productName() + " Initiative",
            description: faker.lorem.sentence(),
            groupId: group.id,
          });
        }
      }
    }

    // Assign Users to Groups
    console.log("Assigning users to groups...");
    for (const userId of userIds) {
      // Each user joins 1-3 groups
      const numGroups = faker.number.int({ min: 1, max: 3 });
      const shuffledGroups = faker.helpers.shuffle(groupIds);
      const selectedGroups = shuffledGroups.slice(0, numGroups);

      for (const groupId of selectedGroups) {
        await db.insert(groupMembers).values({
          userId,
          groupId,
          role: faker.helpers.arrayElement(["admin", "member"]),
        });
      }
    }

    console.log("Seeding complete!");
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

seed();
