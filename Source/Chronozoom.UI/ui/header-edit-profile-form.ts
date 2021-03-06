﻿/// <reference path='../ui/controls/formbase.ts'/>
/// <reference path='../scripts/authoring.ts'/>
/// <reference path='../scripts/typings/jquery/jquery.d.ts'/>

module CZ {
    export module UI {


        export interface FormEditProfileInfo extends CZ.UI.IFormUpdateEntityInfo {
            logoutButton: string;
            usernameInput: string;
            emailInput: string;
            agreeInput: string;
            loginPanel: string;
            profilePanel: string;
            loginPanelLogin: string;
            context: Object;
            allowRedirect: bool;
        }

        export class FormEditProfile extends CZ.UI.FormUpdateEntity {
            private saveButton: JQuery;
            private logoutButton: JQuery;
            private titleInput: JQuery;

            private isCancel: bool;
            private usernameInput: JQuery;
            private emailInput: JQuery;
            private agreeInput: JQuery;
            private loginPanel: JQuery;
            private profilePanel: JQuery;
            private loginPanelLogin: JQuery;
            private allowRedirect: bool;


            constructor(container: JQuery, formInfo: FormEditProfileInfo) {
                super(container, formInfo);
                this.saveButton = container.find(formInfo.saveButton);
                this.logoutButton = container.find(formInfo.logoutButton);
                this.usernameInput = container.find(formInfo.usernameInput);
                this.emailInput = container.find(formInfo.emailInput);
                this.agreeInput = container.find(formInfo.agreeInput);
                this.loginPanel = $(document.body).find(formInfo.loginPanel).first();
                this.profilePanel = $(document.body).find(formInfo.profilePanel).first();
                this.loginPanelLogin = $(document.body).find(formInfo.loginPanelLogin).first();
                this.allowRedirect = formInfo.allowRedirect;

                this.initialize();
            }

            private validEmail(e) {
                // Maximum length is 254: http://stackoverflow.com/questions/386294/what-is-the-maximum-length-of-a-valid-email-address
                if (String(e).length > 254)
                    return false;
                var filter = /^([\w^_]+(?:([-_\.\+][\w^_]+)|)|(xn--[\w^_]+))@([\w^_]+(?:(-+[\w^_]+)|)|(xn--[\w^_]+))(?:\.([\w^_]+(?:([\w-_\.\+][\w^_]+)|)|(xn--[\w^_]+)))$/i;
                return String(e).search(filter) != -1;
            }

            private validUsername(e) {
                var filter = /^[a-z0-9\-_]{4,20}$/i;
                return String(e).search(filter) != -1;
            }


            private initialize(): void {
                var profile = CZ.Service.getProfile();
                profile.done(data => {
                    if (data.DisplayName != null) {
                        this.usernameInput.val(data.DisplayName);
                        if (data.DisplayName != "") {
                            this.usernameInput.prop('disabled', true);
                            this.agreeInput.attr('checked', true);
                            this.agreeInput.prop('disabled', true);
                        }
                        this.emailInput.val(data.Email);
                    }
                });

                this.saveButton.click(event => {
                    var isValid = this.validUsername(this.usernameInput.val());
                    if (!isValid) {
                        alert("Provided incorrect username, \n'a-z', '0-9', '-', '_' - characters allowed only. ");
                        return;
                    }



                    isValid = this.validEmail(this.emailInput.val());
                    if (!isValid) {
                        alert("Provided incorrect email address");
                        return;
                    }

                    isValid = this.agreeInput.prop("checked");
                    if (!isValid) {
                        alert("Please agree with provided terms");
                        return;
                    }

                    Service.getProfile().done((curUser) => {
                        Service.getProfile(this.usernameInput.val()).done((getUser) => {
                            if (curUser.DisplayName == null && typeof getUser.DisplayName != "undefined") {
                                //such username exists
                                alert("Provided username already exists.");
                                return;
                            }
                            CZ.Service.putProfile(this.usernameInput.val(), this.emailInput.val()).then(
                                success => {
                                    // Redirect to personal collection.
                                    if (this.allowRedirect) {
                                        window.location.assign("\\" + success);
                                    }
                                    else {
                                        this.close();
                                    }
                                },
                                function (error) {
                                    alert("Unable to save changes. Please try again later.");
                                    console.log(error);
                                }
                            );
                        });
                    });

                });

                this.logoutButton.click(event =>
                {
                    return $.ajax({
                        url: "/account/logout"
                    }).done(data => {
                        this.profilePanel.hide();
                        this.loginPanel.show();

                        this.close();
                    });
                });
            }

            public show(): void {
                super.show({
                    effect: "slide",
                    direction: "right",
                    duration: 500
                });

                this.activationSource.addClass("active");
            }

            public close() {
                super.close({
                    effect: "slide",
                    direction: "right",
                    duration: 500
                });

                this.activationSource.removeClass("active");
            }
        }
    }
}