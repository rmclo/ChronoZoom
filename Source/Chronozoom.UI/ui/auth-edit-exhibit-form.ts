/// <reference path='contentitem-listbox.ts' />
/// <reference path='../ui/controls/formbase.ts' />
/// <reference path='../scripts/authoring.ts'/>
/// <reference path='../scripts/typings/jquery/jquery.d.ts'/>

module CZ {
    export module UI {
        export interface IFormEditExhibitInfo extends IFormUpdateEntityInfo {
            titleTextblock: string;
            titleInput: string;
            datePicker: string;
            createArtifactButton: string;
            contentItemsListBox: string;
            errorMessage: string;
            deleteButton: string;
            contentItemsTemplate: JQuery;
            context: Object;
        }

        export class FormEditExhibit extends FormUpdateEntity {
            private titleTextblock: JQuery;
            private titleInput: JQuery;
            private datePicker: DatePicker;
            private createArtifactButton: JQuery;
            public  contentItemsListBox: ContentItemListBox;
            private errorMessage: JQuery;
            private saveButton: JQuery;
            private deleteButton: JQuery;

            private contentItemsTemplate: JQuery;

            public  exhibit: any; // CanvasInfodot
            private exhibitCopy: any;

            private mode; // create | edit
            private isCancel: bool; // is form closed without saving changes

            public clickedListItem: ContentItemListItem; // the contentitem on which the user dbl clicked

            constructor(container: JQuery, formInfo: IFormEditExhibitInfo) {
                super(container, formInfo);

                this.titleTextblock = container.find(formInfo.titleTextblock);
                this.titleInput = container.find(formInfo.titleInput);
                this.datePicker = new CZ.UI.DatePicker(container.find(formInfo.datePicker));
                this.createArtifactButton = container.find(formInfo.createArtifactButton);
                this.contentItemsListBox = new CZ.UI.ContentItemListBox(container.find(formInfo.contentItemsListBox), formInfo.contentItemsTemplate, (<any>formInfo.context).contentItems);
                this.errorMessage = container.find(formInfo.errorMessage);
                this.saveButton = container.find(formInfo.saveButton);
                this.deleteButton = container.find(formInfo.deleteButton);

                this.contentItemsTemplate = formInfo.contentItemsTemplate;

                this.exhibit = formInfo.context;
                this.exhibitCopy = $.extend({}, formInfo.context, { children: null }); // shallow copy of exhibit (without children)
                this.exhibitCopy = $.extend(true, {}, this.exhibitCopy); // deep copy of exhibit
                delete this.exhibitCopy.children;
                
                this.mode = CZ.Authoring.mode; // deep copy mode. it never changes throughout the lifecycle of the form.
                this.isCancel = true;

                this.initUI();
            }

            private initUI() {
                if (this.mode === "createExhibit") {
                    this.titleTextblock.text("Create Exhibit");
                    this.saveButton.text("create exhibit");

                    this.titleInput.val(this.exhibit.title || "");
                    this.datePicker.setDate(this.exhibit.infodotDescription.date || "");

                    this.closeButton.show();
                    this.createArtifactButton.show();
                    this.saveButton.show();
                    this.deleteButton.hide();

                    // this.closeButton.click() is handled by base
                    this.createArtifactButton.off();
                    this.createArtifactButton.click(() => this.onCreateArtifact());
                    this.saveButton.off();
                    this.saveButton.click(() => this.onSave());

                    this.contentItemsListBox.itemDblClick((item, index) => this.onContentItemDblClick(item, index));
                    this.contentItemsListBox.itemRemove((item, index) => this.onContentItemRemoved(item, index));
                    this.contentItemsListBox.itemMove((item, indexStart, indexStop) => this.onContentItemMove(item, indexStart, indexStop));

                } else if (this.mode === "editExhibit") {
                    this.titleTextblock.text("Edit Exhibit");
                    this.saveButton.text("update exhibit");

                    this.titleInput.val(this.exhibit.title || "");
                    this.datePicker.setDate(this.exhibit.infodotDescription.date || "");

                    this.closeButton.show();
                    this.createArtifactButton.show();
                    this.saveButton.show();
                    this.deleteButton.show();

                    // this.closeButton.click() is handled by base
                    this.createArtifactButton.off();
                    this.createArtifactButton.click(() => this.onCreateArtifact());
                    this.saveButton.off();
                    this.saveButton.click(() => this.onSave());
                    this.deleteButton.off();
                    this.deleteButton.click(() => this.onDelete());

                    this.contentItemsListBox.itemDblClick((item, index) => this.onContentItemDblClick(item, index));
                    this.contentItemsListBox.itemRemove((item, index) => this.onContentItemRemoved(item, index));
                    this.contentItemsListBox.itemMove((item, indexStart, indexStop) => this.onContentItemMove(item, indexStart, indexStop));

                } else {
                    console.log("Unexpected authoring mode in exhibit form.");
                }
            }

            private onCreateArtifact() {
                if (this.exhibit.contentItems.length < CZ.Settings.infodotMaxContentItemsCount) {
                    this.exhibit.title = this.titleInput.val() || "";
                    this.exhibit.x = this.datePicker.getDate() - this.exhibit.width / 2;
                    this.exhibit.infodotDescription = { date: this.datePicker.getDate() };
                    var newContentItem = {
                        title: "",
                        uri: "",
                        mediaSource: "",
                        mediaType: "",
                        attribution: "",
                        description: "",
                        order: this.exhibit.contentItems.length
                    };
                    this.exhibit.contentItems.push(newContentItem);
                    this.hide(true);
                    CZ.Authoring.contentItemMode = "createContentItem";
                    CZ.Authoring.showEditContentItemForm(newContentItem, this.exhibit, this, true);
                }
            }

            private onSave() {
                var newExhibit = {
                    title: this.titleInput.val() || "",
                    x: this.datePicker.getDate() - this.exhibit.width / 2,
                    y: this.exhibit.y,
                    height: this.exhibit.height,
                    width: this.exhibit.width,
                    infodotDescription: { date: this.datePicker.getDate() },
                    contentItems: this.exhibit.contentItems || [],
                    type: "infodot"
                };

                if (CZ.Authoring.validateExhibitData(this.datePicker.getDate(), this.titleInput.val(), this.exhibit.contentItems) &&
                    CZ.Authoring.checkExhibitIntersections(this.exhibit.parent, newExhibit, true) &&
                    this.exhibit.contentItems.length >= 1 && this.exhibit.contentItems.length <= CZ.Settings.infodotMaxContentItemsCount) {                    
                    CZ.Authoring.updateExhibit(this.exhibitCopy, newExhibit).then(
                        success => {
                            this.isCancel = false;
                            this.close();
                        },
                        error => {
                           alert("Unable to save changes. Please try again later.");
                       }
                    );
                    
                } else {
                    this.errorMessage.show().delay(7000).fadeOut();
                }
            }

            private onDelete() {
                if (confirm("Are you sure want to delete the exhibit and all of its content items? Delete can't be undone!")) {
                    CZ.Authoring.removeExhibit(this.exhibit);
                    this.isCancel = false;
                    this.close();
                }
            }

            private onContentItemDblClick(item: ListItemBase, _: number) {
                var idx = item.data.order;
                if (idx >= 0) {
                    this.clickedListItem = <ContentItemListItem>item;
                    this.exhibit.title = this.titleInput.val() || "";
                    this.exhibit.x = this.datePicker.getDate() - this.exhibit.width / 2;
                    this.exhibit.infodotDescription = { date: this.datePicker.getDate() };
                    this.hide(true);
                    CZ.Authoring.contentItemMode = "editContentItem";
                    CZ.Authoring.showEditContentItemForm(this.exhibit.contentItems[idx], this.exhibit, this, true);
                }
            }

            private onContentItemRemoved(item: ListItemBase, _: number) {
                var idx = item.data.order;
                if (idx >= 0) {
                    this.exhibit.contentItems.splice(idx, 1);
                    for (var i = 0; i < this.exhibit.contentItems.length; i++) this.exhibit.contentItems[i].order = i;
                    this.exhibit = CZ.Authoring.renewExhibit(this.exhibit);
                    CZ.Common.vc.virtualCanvas("requestInvalidate");
                }
            }

            public onContentItemMove(item: ListItemBase, indexStart: number, indexStop: number) {
                var ci = this.exhibit.contentItems.splice(indexStart, 1)[0];
                this.exhibit.contentItems.splice(indexStop, 0, ci);
                for (var i = 0; i < this.exhibit.contentItems.length; i++) this.exhibit.contentItems[i].order = i;
                this.exhibit = CZ.Authoring.renewExhibit(this.exhibit);
                CZ.Common.vc.virtualCanvas("requestInvalidate");
            }

            public show(noAnimation?: bool = false) {
                CZ.Authoring.isActive = true;
                this.activationSource.addClass("active");
                this.errorMessage.hide();
                super.show(noAnimation ? undefined : {
                    effect: "slide",
                    direction: "left",
                    duration: 500
                });
            }

            public hide(noAnimation?: bool = false) {
                super.close(noAnimation ? undefined : {
                    effect: "slide",
                    direction: "left",
                    duration: 500
                });
                this.activationSource.removeClass("active");
            }

            public close(noAnimation?: bool = false) {
                super.close(noAnimation ? undefined : {
                    effect: "slide",
                    direction: "left",
                    duration: 500,
                    complete: () => {
                        this.datePicker.remove();
                        this.contentItemsListBox.clear();
                    }
                });
                if (this.isCancel) {
                    if (this.mode === "createExhibit") {
                        CZ.VCContent.removeChild(this.exhibit.parent, this.exhibit.id);
                        CZ.Common.vc.virtualCanvas("requestInvalidate");
                    } else if (this.mode === "editExhibit") {
                        delete this.exhibit.contentItems;
                        $.extend(this.exhibit, this.exhibitCopy);
                        this.exhibit = CZ.Authoring.renewExhibit(this.exhibit);
                        CZ.Common.vc.virtualCanvas("requestInvalidate");
                    }
                }
                this.activationSource.removeClass("active");
                CZ.Authoring.isActive = false;
            }
        }
    }
}
