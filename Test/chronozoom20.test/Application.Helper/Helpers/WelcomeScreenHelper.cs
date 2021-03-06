﻿using Application.Driver;
using Application.Helper.UserActions;
using OpenQA.Selenium;

namespace Application.Helper.Helpers
{
    public class WelcomeScreenHelper : DependentActions
    {
        public void CloseWelcomePopup()
        {
            if (IsElementDisplayed(By.Id("welcomeScreenOut")))
            {
                Click(By.Id("welcomeScreenCheckbox"));
                Click(By.Id("welcomeScreenCloseButton"));                
            }
        }

        public void StartExploring()
        {
            Logger.Log("<-");
            Click(By.XPath("//*[text()='Start Exploring!']"));
            Logger.Log("->");
        }

        public bool IsWelcomeScreenDispalyed()
        {
            Logger.Log("<-");
            bool result = IsElementExists(By.Id("welcomeScreen"));
            Logger.Log("-> result: " + result);
            return result;
        }

        public void ResetPopupState()
        {
            DeleteCookieByName("welcomeScreenDisallowed");
        }
    }
}