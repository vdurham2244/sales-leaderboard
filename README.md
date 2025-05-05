# Sales Leaderboard

A dynamic leaderboard application to showcase sales performance from HubSpot data.

## Features

- Displays sales data from HubSpot in a rotating leaderboard view
- Shows Year-to-Date, Monthly (April & May), and Weekly sales performance
- Uses Google Sheets and Google Apps Script as a backend
- Customizable user profiles with images

## Setup

### Google Sheets & Apps Script Setup

1. Create a new Google Sheet
2. Go to Extensions > Apps Script
3. Copy the entire `script.js` file from this repo into the Apps Script editor
4. Create a new Script Property for your HubSpot API key:
   - In Apps Script, go to Project Settings > Script Properties
   - Add a new property: `HUBSPOT_API_KEY` with your HubSpot API key value
5. Deploy the script as a web app:
   - Click "Deploy" > "New deployment"
   - Select "Web app" as the type
   - Set "Who has access" to appropriate level (Anyone, Anyone with Google account, etc.)
   - Click "Deploy" and copy the Web App URL

### React App Setup

1. Clone this repository
2. Create a `.env` file in the root directory with:
   ```
   REACT_APP_GOOGLE_SHEETS_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
   ```
   Replace `YOUR_SCRIPT_ID` with your deployed Google Apps Script web app URL.
3. Install dependencies:
   ```
   npm install
   ```
4. Run the app:
   ```
   npm start
   ```

## Customizing User Profiles

Edit the `src/config/users.js` file to add or update user information:

```javascript
{
  name: "User Name",
  email: "user.email@company.com",
  image: "/profile-pictures/user.png"
}
```

Place profile pictures in the `public/profile-pictures/` directory.

## Available Scripts

In the project directory, you can run:

- `npm start`: Runs the app in development mode
- `npm test`: Launches the test runner
- `npm run build`: Builds the app for production

## Updating the Leaderboard Data

The leaderboard data can be updated in two ways:

1. Manually in Google Sheets
2. Using the HubSpot API integration in the Google Apps Script

To update via API:
1. Open your Google Sheet
2. Click on the "Sales Leaderboard" menu at the top
3. Select "Update From HubSpot"

# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
