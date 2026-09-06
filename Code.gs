/**
 * Coin Flip — Google Apps Script web-app entry point.
 *
 * Paste this file into Code.gs and Index.html into an Apps Script project,
 * then deploy the project as a web app.
 */
function doGet() {
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('Coin Flip — Heads or Tails')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}