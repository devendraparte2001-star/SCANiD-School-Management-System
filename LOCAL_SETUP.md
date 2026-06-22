# Local Setup Instructions for SCANiD

Follow these steps to set up the application on your local machine with a .NET Core backend and SQL Server.

## 1. Prerequisites
- **Visual Studio 2022** or **Visual Studio Code**
- **.NET 10.0 SDK**
- **SQL Server** (Express or Developer Edition)
- **SQL Server Management Studio (SSMS)**
- **Node.js** (v18 or higher)

## 2. Database Setup
1. Open SQL Server Management Studio (SSMS).
2. Connect to your local SQL Server instance.
3. Open a new query window.
4. Copy the contents of `/database/setup.sql` into the window.
5. Execute the script to create the `ScanID_DB` database and populate it with sample data.

## 3. Backend Setup (.NET Core)
1. Open a terminal and navigate to the `/backend/ScanID.Api` folder.
2. Open `appsettings.json` and update the `DefaultConnection` string with your local server name.
   - Example: `Server=localhost\\SQLEXPRESS;Database=ScanID_DB;...`
3. Run the following command to restore dependencies:
   ```bash
   dotnet restore
   ```
4. Run the application:
   ```bash
   dotnet run
   ```
5. The API will typically be available at `http://localhost:5000` or `https://localhost:5001`. You can view the Swagger UI at `https://localhost:5001/swagger`.

## 4. Frontend Setup (React)
1. Navigate to the root directory of the React project.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the root directory (if not present) and add your API URL:
   ```env
   # For local development (using Vite proxy to localhost:5000)
   VITE_API_BASE_URL=/api
   ```
   *Note: I have pre-configured `vite.config.ts` to proxy all `/api` and `/SCANiD_ERP_API/api` requests to `http://localhost:5000` during both `npm run dev` and `npm run preview`.*
4. Start the development server:
   ```bash
   npm run dev
   ```

## 5. Mapping UI to Database
The React frontend has been structured to call the API endpoints provided by the .NET backend. All "Master" data (Schools, Teachers, Students) are fetched dynamically from the SQL Server via the `StudentsController`, `SchoolsController`, etc.

## 6. Debugging in VS Code
I have added a `.vscode` folder with `launch.json` and `tasks.json` to make debugging easier.

1. **Launch Backend**:
   - Go to the **Run and Debug** tab in VS Code.
   - Select **.NET Core Launch (Backend)** from the dropdown.
   - Press **F5**. This will build the API and start it with the debugger attached.
2. **Attach to existing process**:
   - If you already ran `dotnet run`, use the **.NET Core Attach** configuration.

## Troubleshooting
- **C# Namespaces showing red or "Microsoft.EntityFrameworkCore does not exist" in VS Code**:
  If your VS Code file editor reports that namespaces like `EntityFrameworkCore`, `DbUpdateConcurrencyException`, or `Swashbuckle` do not exist, this is because VS Code's C# IntelliSense extension has not restored your local NuGet dependencies.
  To fix this instantly:
  1. Open a terminal in `/backend/ScanID.Api/` and execute:
     ```bash
     dotnet restore
     ```
  2. Open the VS Code Command Palette (`Ctrl+Shift+P` on Windows/Linux or `Cmd+Shift+P` on macOS).
  3. Search for and click: **C#: Restart IntelliSense Server** (or **OmniSharp: Restart OmniSharp**).
  4. Build the project locally with:
     ```bash
     dotnet build
     ```
  This will resolve all assembly references and clear all IDE problems in your editor.

- **DirectoryNotFoundException (wwwroot)**: If you get an error saying `wwwroot` is missing, create an empty folder named `wwwroot` in the `/backend/ScanID.Api/` directory. ASP.NET Core expects this folder for static assets even if you aren't serving any yet.
- **CORS Errors**: If you see CORS errors in the browser, ensure your current React URL (e.g., `http://localhost:3000` or `http://localhost:4173`) is listed in your .NET `Program.cs` under `.WithOrigins(...)`.
- **Backend Port & URL**: 
  - For **Local Development**: The `.env.development` file should have `VITE_API_BASE_URL=/api`. The Vite dev server will proxy these requests to `http://localhost:5000`.
  - For **Production Deployment**: The `.env.production` file should have `VITE_API_BASE_URL=/SCANiD_ERP_API/api`.
- **500 Internal Server Error**: I have improved the backend exception handler in `Program.cs`. Check the backend console or `error_logs.txt` in the API directory.
- **Port 5000 ERR_EMPTY_RESPONSE**: If browsing `http://localhost:5000` gives an empty response, I have disabled mandatory HTTPS redirection in `Program.cs` for development mode. Restart your .NET API to apply this change.
- **Dropdowns Blank?**: The application fallback to demo data if the API is unreachable OR returns a 500 error.
