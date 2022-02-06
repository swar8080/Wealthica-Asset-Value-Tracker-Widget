# Asset Value Tracker Widget
A [wealthica.com](https://github.com/wealthica/wealthica.js) widget for tracking the value of fixed-income assets like bonds, GICs, and term deposits.

Asset values are synced automatically when the widget is visible:

![Asset value syncing example](https://i.imgur.com/qsC4myp.png)

---

Changes in asset values are recorded for the first Sunday of every month and on asset maturity:

![Asset transaction history](https://i.imgur.com/DGdjK4t.png)

---

By default, compound interest is used. Also supported is interest that is re-invested at a different interest rate: 

![Asset tracking options](https://i.imgur.com/GlobSjJ.png)

## Using the widget

1. On Wealthica, install the [Developer Add-on](https://app.wealthica.com/addons/details?id=wealthica%2Fwealthica-dev-addon)
2. Visit the Developer Add-on [power-up page](https://app.wealthica.com/addons/wealthica/wealthica-dev-addon)
3. Click the gear icon to the right of the add-on's title text, and then "Configure"
4. Enter the URL of the widget:
   1. https://d15ybym44m0zut.cloudfront.net to use a version hosted on AWS
   2. https://localhost:3000 if you're paranoid and want to run the widget locally 😀 (details below)
5. On the Wealthica dashboard, add the Developer Add-on widget and configure the same URL

![Adding the widget on wealthica.com](https://i.imgur.com/9kF5LWd.png)

## Running the widget locally

This is a create-react-app application, so just:

`npm install && npm run start`

The widget can be added and removed from your dashboard at anytime. Missing wealthica transactions will be backfilled, so you can fire up the widget locally whenever you want to update your assets.
