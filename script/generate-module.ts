import * as fs from "fs";
import * as path from "path";

const moduleName = process.argv[2];

if (!moduleName) {
  console.error("Please provide a module name.");
  process.exit(1);
}

// Case conversion helpers
const toPascalCase = (str: string) =>
  str
    .split(/[-_]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("");

const toCamelCase = (str: string) => {
  const pascal = toPascalCase(str);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
};

const pascalCaseName = toPascalCase(moduleName);
const camelCaseName = toCamelCase(moduleName);
const moduleDir = path.join(__dirname, "..", "src", "modules", moduleName);

if (fs.existsSync(moduleDir)) {
  console.error(`Module "${moduleName}" already exists at ${moduleDir}`);
  process.exit(1);
}

fs.mkdirSync(moduleDir, { recursive: true });

const templates = {
  interface: `import { Model } from "mongoose";

export interface I${pascalCaseName} {
  // Define your interface here
}

export type ${pascalCaseName}Model = Model<I${pascalCaseName}>;
`,
  model: `import { model, Schema } from "mongoose";
import { I${pascalCaseName} } from "./${moduleName}.interface";

const ${camelCaseName}Schema = new Schema<I${pascalCaseName}>(
  {
    // Define your schema here
  },
  {
    timestamps: true,
  }
);

const ${pascalCaseName} = model<I${pascalCaseName}>("${pascalCaseName}", ${camelCaseName}Schema);

export default ${pascalCaseName};
`,
  service: `import { I${pascalCaseName} } from "./${moduleName}.interface";
import ${pascalCaseName} from "./${moduleName}.model";

const create${pascalCaseName} = async (payload: I${pascalCaseName}) => {
  const result = await ${pascalCaseName}.create(payload);
  return result;
};

const ${camelCaseName}Service = {
  create${pascalCaseName},
};

export default ${camelCaseName}Service;
`,
  controller: `import { StatusCodes } from "http-status-codes";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import ${camelCaseName}Service from "./${moduleName}.service";

const create${pascalCaseName} = catchAsync(async (req, res) => {
  const result = await ${camelCaseName}Service.create${pascalCaseName}(req.body);

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "${pascalCaseName} created successfully",
    data: result,
  });
});

export const ${camelCaseName}Controller = {
  create${pascalCaseName},
};
`,
  validation: `import { z } from "zod";

const create${pascalCaseName}Schema = z.object({
  body: z.object({
    // Define your validation schema here
  }),
});

export const ${pascalCaseName}Validation = {
  create${pascalCaseName}Schema,
};
`,
  router: `import { Router } from "express";
import { ${camelCaseName}Controller } from "./${moduleName}.controller";
// import validateRequest from "../../middleware/validateRequest";
// import { ${pascalCaseName}Validation } from "./${moduleName}.validation";

const router = Router();

router.post(
  "/create-${moduleName}",
  // validateRequest(${pascalCaseName}Validation.create${pascalCaseName}Schema),
  ${camelCaseName}Controller.create${pascalCaseName}
);

const ${camelCaseName}Router = router;
export default ${camelCaseName}Router;
`,
};

// Write files
Object.entries(templates).forEach(([type, content]) => {
  const filePath = path.join(moduleDir, `${moduleName}.${type}.ts`);
  fs.writeFileSync(filePath, content);
  console.log(`Created: ${filePath}`);
});

// Update src/router/index.ts
const routerIndexPath = path.join(__dirname, "..", "src", "router", "index.ts");
let routerContent = fs.readFileSync(routerIndexPath, "utf-8");

// 1. Add import
const importStatement = `import ${camelCaseName}Router from "../modules/${moduleName}/${moduleName}.router";\n`;
const lastImportIndex = routerContent.lastIndexOf("import");
const endOfLastImportLine = routerContent.indexOf("\\n", lastImportIndex) + 1;
routerContent = routerContent.slice(0, endOfLastImportLine) + importStatement + routerContent.slice(endOfLastImportLine);

// 2. Add route to moduleRoutes array
const routeObject = `  {
    path: "/${moduleName}",
    route: ${camelCaseName}Router,
  },\n`;

const moduleRoutesMatch = routerContent.match(/const moduleRoutes = \[([\s\S]*?)\];/);
if (moduleRoutesMatch) {
  const arrayContent = moduleRoutesMatch[1];
  const lastBracketIndex = routerContent.indexOf("];", moduleRoutesMatch.index);
  routerContent = routerContent.slice(0, lastBracketIndex) + routeObject + routerContent.slice(lastBracketIndex);
}

fs.writeFileSync(routerIndexPath, routerContent);
console.log(`Updated: ${routerIndexPath}`);

console.log(`\nModule "${moduleName}" successfully generated!`);
