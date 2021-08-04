
# DaVinci App for Amazon Connect
Please follow the following steps to successfully get the app up and running:

 1. Clone the repository on your local computer.
 2. Navigate to the ClientApp folder within the repository, run the command "**npm install**" in terminal to install all node dependencies.
 3. In VS Code, run the project using "**F5**". In VS Code's the debug console, notice the port that the project is running on, by default it should be https://127.0.0.1:4200.
 4.   Download and install Fiddler from https://www.telerik.com/download/fiddler. We will use Fiddler to map the port that the project is running on, to a contactcanvas domain. This is important to avoid CORS issues. To do this:
        1. Open Fiddler and go to Tools > HOSTS.
        2. In the new HOSTS window which opens, check the enable mapping box, if it is unchecked.
        3. Add the following mapping in the list: "**127.0.0.1:4200 connect-test.contactcanvas.com**"
        4. Click save.
5. Login to https://studio-dev.contactcanvas.com and navigate to the Apps section.
6. Ensure that you have the following apps loaded:
    * GlobalPresenceControl
    * DAVINCI APP FOR SALESFORCE (or any other CRM App)
    * DAVINCI APP FOR AMAZON CONNECT 
7. Click on Amazon Connect and then More. Then, click on Config and click on "DaVinci App for Amazon Connect".  This will open up the configuration panel.
8. Here, change the "**URL**" parameter to "https://connect-test.contactcanvas.com". 
9. Furthermore, in this panel, replace the "\<instanceName>" in the **LogoutLink** and **ConnectCcpUrl** parameters with your Amazon Connect instance name. For example, if your instance name is testorg, then the logout link would look like **https://testorg.awsapps.com/connect/logout**, save the app.
10. Navigate to your instance in the  Amazon Connect console, and go to the "Approved Origins" tab.
11. Here, add to the list of approved origins:   
    * https://connect-test.contactcanvas.com
    * https://agent-dev.contactcanvas.com
    * Your Salesforce domain, for example https://na1234.lightning.force.com
12. You should now be able to login to your softphone in Salesforce and use Amazon Connect with either DaVinci UI or Connect's UI.

