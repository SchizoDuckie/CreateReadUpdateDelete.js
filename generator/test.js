

/*
 * Addon
 */
var Addon = CRUD.define({
	className: "Addon",
	table: "addons",
	primary: "ID_Addon",
	fields: ["ID_Addon","ID_Client","active","lastUpdated","name","type","archiveLocation","testresult"],
	relations: { 
		"Client" : CRUD.RELATION_FOREIGN
	}, 
	connectors: { },
	createStatement: 'CREATE TABLE addons (   ID_Addon INTEGER PRIMARY KEY NOT NULL,   ID_Client int(11) NOT NULL,   active char(1) NOT NULL DEFAULT "1",   lastUpdated timestamp NOT NULL DEFAULT "0000-00-00 00:00:00",   name varchar(250) NOT NULL,   type enum(10) NOT NULL,   archiveLocation varchar(1024) NOT NULL , "testresult" VARCHAR DEFAULT 15, `exported`  char(1), `cacheTimeMinutes` INT NOT NULL DEFAULT  "0", `lastCached` TIMESTAMP  NULL)',
	adapter: "dbAdapter"
});

/*
 * Catalog
 */
var Catalog = CRUD.define({
	className: "Catalog",
	table: "catalog",
	primary: "ID_Catalog",
	fields: ["ID_Catalog","ID_Client","ID_Datafeed","Name","lastUpdated"],
	relations: { 
		"Image" : CRUD.RELATION_MANY
		"Product" : dbObject.RELATION_SINGLE
		"Category" : dbObject.RELATION_SINGLE
		"Presentation" : dbObject.RELATION_SINGLE
		"Assortment" : dbObject.RELATION_SINGLE
		"Datafeed" : CRUD.RELATION_FOREIGN
		"Client" : CRUD.RELATION_FOREIGN
	}, 
	connectors: {
		"Image" : "CatalogImage"
 	},
 	createStatement: 'CREATE TABLE catalog (   ID_Catalog INTEGER PRIMARY KEY NOT NULL,   ID_Client int(11) NOT NULL,   ID_Datafeed int(11) DEFAULT NULL,   Name varchar(250) NOT NULL,   lastUpdated timestamp NOT NULL DEFAULT "0000-00-00 00:00:00" )',
	adapter: "dbAdapter"
});

/*
 * Datafeed
 */
var Datafeed = CRUD.define({
	className: "Datafeed",
	table: "client_datafeeds",
	primary: "ID_Datafeed",
	fields: ["ID_Datafeed","ID_Client","feedURL","feedType","enabled","updateFrequency","dataDirection"],
	relations: { 
		"Client" : CRUD.RELATION_MANY
		"Client" : CRUD.RELATION_FOREIGN
	}, 
	connectors: {
		"Client" : "Catalog"
 	},
 	createStatement: 'CREATE TABLE client_datafeeds (   ID_Datafeed INTEGER PRIMARY KEY NOT NULL,   ID_Client int(11) NOT NULL,   feedURL varchar(1024) NOT NULL,   feedType enum(9) NOT NULL,   enabled char(1) NOT NULL DEFAULT "1",     updateFrequency int(10) NOT NULL , "dataDirection" TEXT)',
	adapter: "dbAdapter"
});

/*
 * ClientImportMapping
 */
var ClientImportMapping = CRUD.define({
	className: "ClientImportMapping",
	table: "client_importmappings",
	primary: "ID_ClientImportMapping",
	fields: ["ID_ClientImportMapping","ID_Client","ID_ClientDataFeed","originMapping","salesBoardMapping"],
	relations: { 
		"Client" : CRUD.RELATION_FOREIGN
	}, 
	connectors: {
		
 	},
 	createStatement: 'CREATE TABLE client_importmappings (   ID_ClientImportMapping INTEGER PRIMARY KEY NOT NULL,   ID_Client int(11) NOT NULL,   ID_ClientDataFeed int(11) NOT NULL,   originMapping varchar(250) NOT NULL,   salesBoardMapping varchar(250) NOT NULL )',
	adapter: "dbAdapter"
});

/*
 * ClientImport
 */
var ClientImport = CRUD.define({
	className: "ClientImport",
	table: "client_imports",
	primary: "ID_ClientImport",
	fields: ["ID_ClientImport","importDate","importType","importStatus","sourceFile","ID_Client","description"],
	relations: { 
		"Client" : CRUD.RELATION_FOREIGN
	}, 
	connectors: {
		
 	},
 	createStatement: 'CREATE TABLE client_imports (   ID_ClientImport INTEGER PRIMARY KEY NOT NULL,   importDate timestamp NOT NULL DEFAULT "0000-00-00 00:00:00",   importType enum(3) NOT NULL,   importStatus enum(6) NOT NULL,   sourceFile varchar(1024) NOT NULL,   ID_Client int(11) NOT NULL,   description varchar(255) NOT NULL )',
	adapter: "dbAdapter"
});

/*
 * Client
 */
var Client = CRUD.define({
	className: "Client",
	table: "clients",
	primary: "ID_Client",
	fields: ["ID_Client","name","Company","ID_AdminUser","Created","enabled","website","adminEmail","ContactData","ID_License","internalName"],
	relations: { 
		"Datafeed" : CRUD.RELATION_MANY
		"ProductType" : CRUD.RELATION_MANY
		"User" : CRUD.RELATION_MANY
		"Product" : CRUD.RELATION_MANY
		"Addon" : dbObject.RELATION_SINGLE
		"Datafeed" : dbObject.RELATION_SINGLE
		"ClientImportMapping" : dbObject.RELATION_SINGLE
		"ClientImport" : dbObject.RELATION_SINGLE
		"Image" : dbObject.RELATION_SINGLE
		"ProductValue" : dbObject.RELATION_SINGLE
		"ProductType" : dbObject.RELATION_SINGLE
		"Report" : dbObject.RELATION_SINGLE
		"Category" : dbObject.RELATION_SINGLE
		"Presentation" : dbObject.RELATION_SINGLE
		"ClientMessage" : dbObject.RELATION_SINGLE
		"Assortment" : dbObject.RELATION_SINGLE
		"Video" : dbObject.RELATION_SINGLE
		"Landingpage" : dbObject.RELATION_SINGLE
		"User" : dbObject.RELATION_SINGLE
		"UserGroup" : dbObject.RELATION_SINGLE
		"Group" : dbObject.RELATION_SINGLE
		"Invoice" : dbObject.RELATION_SINGLE
		"License" : CRUD.RELATION_FOREIGN
	}, 
	connectors: {
		"Datafeed" : "Catalog"
		"ProductType" : "ProductProperty"
		"User" : "Quote"
		"Product" : "ProductFinancialdata"
 	},
 	createStatement: 'CREATE TABLE clients (   ID_Client INTEGER PRIMARY KEY NOT NULL,   name varchar(255) NOT NULL,   Company varchar(255) NOT NULL,   ID_AdminUser int(11) DEFAULT NULL,   Created timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,   enabled char(1) NOT NULL,   website varchar(1024) NOT NULL,   adminEmail varchar(255) NOT NULL , "ContactData" TEXT DEFAULT NULL, "ID_License" INTEGER DEFAULT NULL, "internalName" VARCHAR)',
	adapter: "dbAdapter"
});

/*
 * Image
 */
var Image = CRUD.define({
	className: "Image",
	table: "images",
	primary: "ID_Image",
	fields: ["ID_Image","ID_Client","name","mediumLocation","largeLocation","tinyLocation","description","lastUpdated","created"],
	relations: { 
		"Product" : CRUD.RELATION_MANY
		"Slide" : CRUD.RELATION_MANY
		"Catalog" : CRUD.RELATION_MANY
		"Client" : CRUD.RELATION_FOREIGN
		"Category" : dbObject.RELATION_SINGLE
		"Assortment" : dbObject.RELATION_SINGLE
		"Landingpage" : dbObject.RELATION_SINGLE
	}, 
	connectors: {
		"Product" : "ProductImage"
		"Slide" : "SlideImage"
		"Catalog" : "CatalogImage"
 	},
 	createStatement: 'CREATE TABLE images (    ID_Image INTEGER PRIMARY KEY NOT NULL,   ID_Client int(11) NOT NULL,   name varchar(100) NOT NULL,   mediumLocation varchar(1024) NOT NULL,   largeLocation varchar(1024) NOT NULL,   tinyLocation varchar(1024) NOT NULL,   description varchar(1024) NOT NULL,   lastUpdated timestamp NOT NULL DEFAULT "0000-00-00 00:00:00",   created timestamp NOT NULL DEFAULT "0000-00-00 00:00:00" )',
	adapter: "dbAdapter"
});

/*
 * License
 */
var License = CRUD.define({
	className: "License",
	table: "licenses",
	primary: "ID_License",
	fields: ["ID_License","Name","Description","Price","maxUsers","maxDatafeeds","maxStorage","maxCategories","maxCatalog","validDays","enabled"],
	relations: { 
		"Client" : dbObject.RELATION_SINGLE
	}, 
	connectors: {
		
 	},
 	createStatement: 'CREATE TABLE licenses (   ID_License INTEGER PRIMARY KEY NOT NULL,   Name varchar(250) NOT NULL,   Description varchar(250) NOT NULL,   Price double(8,2) NOT NULL,   maxUsers int(2) NOT NULL,   maxDatafeeds int(2) NOT NULL,   maxStorage int(3) NOT NULL,   maxCategories int(2) NOT NULL,   maxCatalog int(2) NOT NULL,   validDays int(11) NOT NULL DEFAULT 30,   enabled char(1) NOT NULL DEFAULT "1" )',
	adapter: "dbAdapter"
});

/*
 * PresentationSlide
 */
var PresentationSlide = CRUD.define({
	className: "PresentationSlide",
	table: "presentations_slides",
	primary: "ID_PresentationSlide",
	fields: ["ID_PresentationSlide","ID_Presentation","ID_Slide","slideIndex","subSlideIndex"],
	relations: { 
		"Presentation" : CRUD.RELATION_FOREIGN
		"Slide" : CRUD.RELATION_FOREIGN
	}, 
	connectors: {
		
 	},
 	createStatement: 'CREATE TABLE presentations_slides (   ID_PresentationSlide INTEGER PRIMARY KEY NOT NULL,   ID_Presentation int(11) NOT NULL,   ID_Slide int(11) NOT NULL,   slideIndex int(3) NOT NULL,   subSlideIndex int(3) NOT NULL )',
	adapter: "dbAdapter"
});

/*
 * ProductProperty
 */
var ProductProperty = CRUD.define({
	className: "ProductProperty",
	table: "productproperties",
	primary: "ID_ProductProperty",
	fields: ["ID_ProductProperty","ID_Client","ID_ProductType","Property","Description","Validation","Minlength","Maxlength","SortOrder","ValueList","showOnInvoice","showOnOverview","isInvoiceMutator","showOnFullView"],
	relations: { 
		"Client" : CRUD.RELATION_FOREIGN
		"ProductValue" : dbObject.RELATION_SINGLE
		"InvoiceRow" : dbObject.RELATION_SINGLE
		"ProductType" : CRUD.RELATION_FOREIGN
	}, 
	connectors: {
		
 	},
 	createStatement: 'CREATE TABLE productproperties (    ID_ProductProperty INTEGER PRIMARY KEY NOT NULL,   ID_Client int(11) NOT NULL,   ID_ProductType int(11) NOT NULL,   Property varchar(100) NOT NULL,   Description varchar(255) DEFAULT NULL,   Validation varchar(15) DEFAULT NULL,   Minlength tinyint(6) DEFAULT NULL,   Maxlength tinyint(6) DEFAULT NULL,   SortOrder tinyint(3) NOT NULL,   ValueList mediumtext , "showOnInvoice" CHAR DEFAULT 0, "showOnOverview" CHAR DEFAULT 0, "isInvoiceMutator" CHAR DEFAULT 0, "showOnFullView" CHAR DEFAULT 1)',
	adapter: "dbAdapter"
});

/*
 * Product
 */
var Product = CRUD.define({
	className: "Product",
	table: "products",
	primary: "ID_Product",
	fields: ["ID_Product","ID_ProductType","ID_Catalog","Name","LongDescription","ShortDescription","Price","ID_DefaultImage","Inserted","lastUpdated","ID_Video"],
	relations: { 
		"Image" : CRUD.RELATION_MANY
		"Slide" : CRUD.RELATION_MANY
		"Client" : CRUD.RELATION_MANY
		"Assortment" : CRUD.RELATION_MANY
		"Category" : CRUD.RELATION_MANY
		"Catalog" : CRUD.RELATION_FOREIGN
		"ProductValue" : dbObject.RELATION_SINGLE
		"InvoiceRow" : dbObject.RELATION_SINGLE
		"ProductRelatedProduct" : dbObject.RELATION_SINGLE
		"ProductType" : CRUD.RELATION_FOREIGN
		"Video" : CRUD.RELATION_FOREIGN
	}, 
	connectors: {
		"Image" : "ProductImage"
		"Slide" : "SlideProduct"
		"Client" : "ProductFinancialdata"
		"Assortment" : "ProductAssortmentProduct"
		"Category" : "CategoryProduct"
 	},
 	createStatement: 'CREATE TABLE products (   ID_Product INTEGER PRIMARY KEY NOT NULL,   ID_ProductType int(11) NOT NULL,   ID_Catalog int(11) NOT NULL,   Name varchar(1024) NOT NULL,   LongDescription text,   ShortDescription varchar(255) NOT NULL,   Price double(8,2) DEFAULT NULL,   ID_DefaultImage int(11) DEFAULT NULL,   Inserted timestamp DEFAULT NULL,   lastUpdated timestamp DEFAULT CURRENT_TIMESTAMP , "ID_Video" INTEGER DEFAULT NULL)',
	adapter: "dbAdapter"
});

/*
 * ProductImage
 */
var ProductImage = CRUD.define({
	className: "ProductImage",
	table: "products_images",
	primary: "ID_Product_Image",
	fields: ["ID_Product_Image","ID_Image","ID_Product"],
	relations: { 
		"Image" : CRUD.RELATION_FOREIGN
		"Product" : CRUD.RELATION_FOREIGN
	}, 
	connectors: {
		
 	},
 	createStatement: 'CREATE TABLE products_images (    ID_Product_Image INTEGER PRIMARY KEY NOT NULL,   ID_Image int(11) NOT NULL,   ID_Product int(11) NOT NULL )',
	adapter: "dbAdapter"
});

/*
 * ProductValue
 */
var ProductValue = CRUD.define({
	className: "ProductValue",
	table: "products_values",
	primary: "ID_ProductValue",
	fields: ["ID_ProductValue","ID_Client","ID_ProductProperty","ID_Product","Value","LastModified"],
	relations: { 
		"Client" : CRUD.RELATION_FOREIGN
		"ProductProperty" : CRUD.RELATION_FOREIGN
		"Product" : CRUD.RELATION_FOREIGN
	}, 
	connectors: {
		
 	},
 	createStatement: 'CREATE TABLE products_values (    ID_ProductValue INTEGER PRIMARY KEY NOT NULL,   ID_Client int(11) NOT NULL,   ID_ProductProperty int(11) NOT NULL,   ID_Product int(11) NOT NULL,   Value varchar(1024) NOT NULL,   LastModified timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP )',
	adapter: "dbAdapter"
});

/*
 * ProductType
 */
var ProductType = CRUD.define({
	className: "ProductType",
	table: "producttypes",
	primary: "ID_ProductType",
	fields: ["ID_ProductType","ID_Client","ProductName","Enabled","Updated"],
	relations: { 
		"Client" : CRUD.RELATION_MANY
		"Client" : CRUD.RELATION_FOREIGN
		"Product" : dbObject.RELATION_SINGLE
	}, 
	connectors: {
		"Client" : "ProductProperty"
 	},
 	createStatement: 'CREATE TABLE producttypes (    ID_ProductType INTEGER PRIMARY KEY NOT NULL,   ID_Client int(11) NOT NULL,   ProductName varchar(200) NOT NULL,   Enabled char(1) NOT NULL DEFAULT "1",   Updated timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP )',
	adapter: "dbAdapter"
});

/*
 * Report
 */
var Report = CRUD.define({
	className: "Report",
	table: "reports",
	primary: "ID_Report",
	fields: ["ID_Report","ReportType","ID_Client","ID_User","Generated","AccessCount","template","pdfLocation"],
	relations: { 
		"Client" : CRUD.RELATION_FOREIGN
		"User" : CRUD.RELATION_FOREIGN
	}, 
	connectors: {
		
 	},
 	createStatement: 'CREATE TABLE reports (    ID_Report INTEGER PRIMARY KEY NOT NULL,   ReportType enum(8) NOT NULL,   ID_Client int(11) NOT NULL,   ID_User int(11) NOT NULL,   Generated timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,   AccessCount int(7) NOT NULL,   template int(10) NOT NULL,   pdfLocation varchar(1024) NOT NULL )',
	adapter: "dbAdapter"
});

/*
 * SlideCategory
 */
var SlideCategory = CRUD.define({
	className: "SlideCategory",
	table: "slides_categories",
	primary: "ID_SlideCategory",
	fields: ["ID_SlideCategory","ID_Slide","ID_Category","displayType","categoryIndex"],
	relations: { 
		"Category" : CRUD.RELATION_FOREIGN
		"Slide" : CRUD.RELATION_FOREIGN
	}, 
	connectors: {
		
 	},
 	createStatement: 'CREATE TABLE slides_categories (   ID_SlideCategory INTEGER PRIMARY KEY NOT NULL,   ID_Slide int(11) NOT NULL,   ID_Category int(11) NOT NULL,   displayType enum(7) NOT NULL,   categoryIndex int(2) NOT NULL )',
	adapter: "dbAdapter"
});

/*
 * SlideImage
 */
var SlideImage = CRUD.define({
	className: "SlideImage",
	table: "slides_images",
	primary: "ID_SlideImage",
	fields: ["ID_SlideImage","ID_Slide","ID_Image","displayType","imageIndex"],
	relations: { 
		"Image" : CRUD.RELATION_FOREIGN
		"Slide" : CRUD.RELATION_FOREIGN
	}, 
	connectors: {
		
 	},
 	createStatement: 'CREATE TABLE slides_images (   ID_SlideImage INTEGER PRIMARY KEY NOT NULL,   ID_Slide int(11) NOT NULL,   ID_Image int(11) NOT NULL,   displayType enum(7) NOT NULL,   imageIndex int(2) NOT NULL )',
	adapter: "dbAdapter"
});

/*
 * SlideProduct
 */
var SlideProduct = CRUD.define({
	className: "SlideProduct",
	table: "slides_products",
	primary: "ID_SlideProduct",
	fields: ["ID_SlideProduct","ID_Slide","ID_Product","displayType","productIndex"],
	relations: { 
		"Product" : CRUD.RELATION_FOREIGN
		"Slide" : CRUD.RELATION_FOREIGN
	}, 
	connectors: {
		
 	},
 	createStatement: 'CREATE TABLE slides_products (   ID_SlideProduct INTEGER PRIMARY KEY NOT NULL,   ID_Slide int(11) NOT NULL,   ID_Product int(11) NOT NULL,   displayType enum(7) NOT NULL,   productIndex int(2) NOT NULL )',
	adapter: "dbAdapter"
});

/*
 * SlideVideo
 */
var SlideVideo = CRUD.define({
	className: "SlideVideo",
	table: "slides_videos",
	primary: "ID_SlideVideo",
	fields: ["ID_SlideVideo","ID_Slide","ID_Video","displayType","videoIndex"],
	relations: { 
		"Video" : CRUD.RELATION_FOREIGN
		"Slide" : CRUD.RELATION_FOREIGN
	}, 
	connectors: {
		
 	},
 	createStatement: 'CREATE TABLE slides_videos (   ID_SlideVideo INTEGER PRIMARY KEY NOT NULL,   ID_Slide int(11) NOT NULL,   ID_Video int(11) NOT NULL,   displayType enum(7) NOT NULL,   videoIndex int(2) NOT NULL )',
	adapter: "dbAdapter"
});

/*
 * Category
 */
var Category = CRUD.define({
	className: "Category",
	table: "categories",
	primary: "ID_Category",
	fields: ["ID_Category","Name","ID_Image","Description","ID_ParentCategory","CategoryType","isVisible","sortOrder","ID_Catalog","ID_Client"],
	relations: { 
		"Slide" : CRUD.RELATION_MANY
		"Product" : CRUD.RELATION_MANY
		"Catalog" : CRUD.RELATION_FOREIGN
		"Client" : CRUD.RELATION_FOREIGN
		"Image" : CRUD.RELATION_FOREIGN
		"Presentation" : dbObject.RELATION_SINGLE
		"Landingpage" : dbObject.RELATION_SINGLE
	}, 
	connectors: {
		"Slide" : "SlideCategory"
		"Product" : "CategoryProduct"
 	},
 	createStatement: 'CREATE TABLE "categories" ("ID_Category" INTEGER PRIMARY KEY  NOT NULL ,"Name" varchar(255) NOT NULL ,"ID_Image" int(11) DEFAULT (NULL) ,"Description" varchar(255) NOT NULL ,"ID_ParentCategory" int(11) NOT NULL  DEFAULT (0) ,"CategoryType" enum(10) NOT NULL  DEFAULT ("property") ,"isVisible" char(1) NOT NULL  DEFAULT ("1") ,"sortOrder" int(2) DEFAULT (1) ,"ID_Catalog" int(11) DEFAULT (NULL) , "ID_Client" int(11))',
	adapter: "dbAdapter"
});

/*
 * Presentation
 */
var Presentation = CRUD.define({
	className: "Presentation",
	table: "presentations",
	primary: "ID_Presentation",
	fields: ["ID_Presentation","ID_Client","name","template","forceUpdate","lastUpdated","lastAccessed","ID_Catalog","ID_Category","globalCSS","globalJS"],
	relations: { 
		"Slide" : CRUD.RELATION_MANY
		"User" : CRUD.RELATION_MANY
		"Group" : CRUD.RELATION_MANY
		"Catalog" : CRUD.RELATION_FOREIGN
		"Client" : CRUD.RELATION_FOREIGN
		"Category" : CRUD.RELATION_FOREIGN
	}, 
	connectors: {
		"Slide" : "PresentationSlide"
		"User" : "PresentationUser"
		"Group" : "PresentationGroupPresentation"
 	},
 	createStatement: 'CREATE TABLE "presentations" ("ID_Presentation" INTEGER PRIMARY KEY  NOT NULL ,"ID_Client" int(4) NOT NULL ,"name" varchar(256) DEFAULT (NULL) ,"template" varchar(50) NOT NULL ,"forceUpdate" char(1) NOT NULL  DEFAULT ("1") ,"lastUpdated" timestamp NOT NULL  DEFAULT ("0000-00-00 00:00:00") ,"lastAccessed" timestamp NOT NULL  DEFAULT ("0000-00-00 00:00:00") ,"ID_Catalog" INTEGER NOT NULL , "ID_Category" INTEGER, "globalCSS" TEXT, "globalJS" TEXT)',
	adapter: "dbAdapter"
});

/*
 * ProductFinancialdata
 */
var ProductFinancialdata = CRUD.define({
	className: "ProductFinancialdata",
	table: "products_financialdata",
	primary: "ID_ProductFinancialdata",
	fields: ["ID_ProductFinancialdata","ID_Client","ID_Product","VATPercentage","Discount","WholesalePrice","RetailMarkup"],
	relations: { 
		"Client" : CRUD.RELATION_FOREIGN
		"Product" : CRUD.RELATION_FOREIGN
	}, 
	connectors: {
		
 	},
 	createStatement: 'CREATE TABLE products_financialdata (   ID_ProductFinancialdata INTEGER PRIMARY KEY NOT NULL,   ID_Client int(11) NOT NULL,   ID_Product int(11) NOT NULL,   VATPercentage int(3) NOT NULL,   Discount tiny int(3) NOT NULL,   WholesalePrice double NOT NULL,   RetailMarkup tinyINTEGER(3) NOT NULL )',
	adapter: "dbAdapter"
});

/*
 * InvoiceRow
 */
var InvoiceRow = CRUD.define({
	className: "InvoiceRow",
	table: "invoicerows",
	primary: "ID_InvoiceRow",
	fields: ["ID_InvoiceRow","ID_Invoice","ID_Product","Amount","Discount","TotalPrice","ID_ProductProperty","MutatorValue"],
	relations: { 
		"ProductProperty" : CRUD.RELATION_FOREIGN
		"Product" : CRUD.RELATION_FOREIGN
		"Invoice" : CRUD.RELATION_FOREIGN
	}, 
	connectors: {
		
 	},
 	createStatement: 'CREATE TABLE "invoicerows" ("ID_InvoiceRow" INTEGER PRIMARY KEY  NOT NULL ,"ID_Invoice" int(11) NOT NULL ,"ID_Product" int(11) NOT NULL ,"Amount" int(11) NOT NULL ,"Discount" int(11) DEFAULT (NULL) ,"TotalPrice" double(8,2) NOT NULL ,"ID_ProductProperty" int(11) DEFAULT (NULL) , "MutatorValue" VARCHAR DEFAULT 255)',
	adapter: "dbAdapter"
});

/*
 * ClientMessage
 */
var ClientMessage = CRUD.define({
	className: "ClientMessage",
	table: "clients_messages",
	primary: "ID_ClientMessage",
	fields: ["ID_ClientMessage","ID_Client","ID_FromUser","ID_ToUser","subject","body","isRead","timestamp"],
	relations: { 
		"Client" : CRUD.RELATION_FOREIGN
	}, 
	connectors: {
		
 	},
 	createStatement: 'CREATE TABLE "clients_messages" ("ID_ClientMessage" INTEGER PRIMARY KEY  NOT NULL ,"ID_Client" INTEGER,"ID_FromUser" INTEGER NOT NULL ,"ID_ToUser" INTEGER,"subject" VARCHAR(1024),"body" text,"isRead" CHAR(1) DEFAULT (0) ,"timestamp" DATETIME DEFAULT (CURRENT_TIMESTAMP) )',
	adapter: "dbAdapter"
});

/*
 * Assortment
 */
var Assortment = CRUD.define({
	className: "Assortment",
	table: "assortments",
	primary: "ID_Assortment",
	fields: ["ID_Assortment","ID_Catalog","ID_Client","Title","Description","WholesalePrice","Price","Discount","ID_Image"],
	relations: { 
		"Product" : CRUD.RELATION_MANY
		"Catalog" : CRUD.RELATION_FOREIGN
		"Client" : CRUD.RELATION_FOREIGN
		"Image" : CRUD.RELATION_FOREIGN
	}, 
	connectors: {
		"Product" : "ProductAssortmentProduct"
 	},
 	createStatement: 'CREATE TABLE "assortments" ("ID_Assortment" INTEGER PRIMARY KEY  AUTOINCREMENT  NOT NULL , "ID_Catalog" INTEGER NOT NULL , "ID_Client" INTEGER NOT NULL , "Title" VARCHAR, "Description" VARCHAR, "WholesalePrice" DOUBLE, "Price" DOUBLE, "Discount" INTEGER, "ID_Image" INTEGER)',
	adapter: "dbAdapter"
});

/*
 * ProductAssortmentProduct
 */
var ProductAssortmentProduct = CRUD.define({
	className: "ProductAssortmentProduct",
	table: "assortments_products",
	primary: "ID_ProductAssortmentProduct",
	fields: ["ID_ProductAssortmentProduct","ID_Assortment","ID_Product","Amount","SizeArc","Locked"],
	relations: { 
		"Product" : CRUD.RELATION_FOREIGN
		"Assortment" : CRUD.RELATION_FOREIGN
	}, 
	connectors: {
		
 	},
 	createStatement: 'CREATE TABLE "assortments_products" ("ID_ProductAssortmentProduct" INTEGER PRIMARY KEY  AUTOINCREMENT  NOT NULL , "ID_Assortment" INTEGER NOT NULL , "ID_Product" INTEGER NOT NULL , "Amount" INTEGER, "SizeArc" TEXT, "Locked" CHAR NOT NULL  DEFAULT 0)',
	adapter: "dbAdapter"
});

/*
 * CatalogImage
 */
var CatalogImage = CRUD.define({
	className: "CatalogImage",
	table: "catalog_images",
	primary: "ID_CatalogImage",
	fields: ["ID_CatalogImage","ID_Catalog","ID_Image"],
	relations: { 
		"Catalog" : CRUD.RELATION_FOREIGN
		"Image" : CRUD.RELATION_FOREIGN
	}, 
	connectors: {
		
 	},
 	createStatement: 'CREATE TABLE "catalog_images" ("ID_CatalogImage" INTEGER PRIMARY KEY  AUTOINCREMENT  NOT NULL , "ID_Catalog" INTEGER, "ID_Image" INTEGER)',
	adapter: "dbAdapter"
});

/*
 * ProductRelatedProduct
 */
var ProductRelatedProduct = CRUD.define({
	className: "ProductRelatedProduct",
	table: "products_relatedproducts",
	primary: "ID_Product_RelatedProduct",
	fields: ["ID_Product_RelatedProduct","ID_Product","ID_RelatedProduct"],
	relations: { 
		"Product" : CRUD.RELATION_FOREIGN
	}, 
	connectors: {
		
 	},
 	createStatement: 'CREATE TABLE "products_relatedproducts" ("ID_Product_RelatedProduct" INTEGER PRIMARY KEY  AUTOINCREMENT  NOT NULL , "ID_Product" INTEGER NOT NULL , "ID_RelatedProduct" INTEGER NOT NULL )',
	adapter: "dbAdapter"
});

/*
 * Slidetemplate
 */
var Slidetemplate = CRUD.define({
	className: "Slidetemplate",
	table: "slidetemplates",
	primary: "ID_Slidetemplate",
	fields: ["ID_Slidetemplate","Name","Icon","nTargets"],
	relations: { 
		
	}, 
	connectors: {
		
 	},
 	createStatement: 'CREATE TABLE "slidetemplates" ("ID_Slidetemplate" INTEGER PRIMARY KEY  AUTOINCREMENT  NOT NULL , "Name" VARCHAR NOT NULL , "Icon"  NOT NULL , "nTargets" )',
	adapter: "dbAdapter"
});

/*
 * Video
 */
var Video = CRUD.define({
	className: "Video",
	table: "videos",
	primary: "ID_Video",
	fields: ["ID_Video","Title","Description","ID_Client","FileName"],
	relations: { 
		"Slide" : CRUD.RELATION_MANY
		"Client" : CRUD.RELATION_FOREIGN
		"Product" : dbObject.RELATION_SINGLE
	}, 
	connectors: {
		"Slide" : "SlideVideo"
 	},
 	createStatement: 'CREATE TABLE "videos" ("ID_Video" INTEGER PRIMARY KEY  AUTOINCREMENT  NOT NULL , "Title" VARCHAR NOT NULL , "Description" VARCHAR NOT NULL , "ID_Client" INTEGER NOT NULL , "FileName" VARCHAR NOT NULL )',
	adapter: "dbAdapter"
});

/*
 * CategoryProduct
 */
var CategoryProduct = CRUD.define({
	className: "CategoryProduct",
	table: "categories_products",
	primary: "ID_Category_Product",
	fields: ["ID_Category_Product","ID_Category","ID_Product","sortOrder","enabled"],
	relations: { 
		"Product" : CRUD.RELATION_FOREIGN
		"Category" : CRUD.RELATION_FOREIGN
	}, 
	connectors: {
		
 	},
 	createStatement: 'CREATE TABLE "categories_products" ("ID_Category_Product" INTEGER PRIMARY KEY  NOT NULL ,"ID_Category" int(11) NOT NULL ,"ID_Product" int(11) NOT NULL ,"sortOrder" int(2) DEFAULT (1) ,"enabled" char(1) NOT NULL )',
	adapter: "dbAdapter"
});

/*
 * Landingpage
 */
var Landingpage = CRUD.define({
	className: "Landingpage",
	table: "landingpages",
	primary: "ID_Landingpage",
	fields: ["ID_Landingpage","ID_Category","ID_Client","Content","ID_Image"],
	relations: { 
		"Client" : CRUD.RELATION_FOREIGN
		"Image" : CRUD.RELATION_FOREIGN
		"Category" : CRUD.RELATION_FOREIGN
	}, 
	connectors: {
		
 	},
 	createStatement: 'CREATE TABLE "landingpages" ("ID_Landingpage" INTEGER PRIMARY KEY  NOT NULL ,"ID_Category" INTEGER NOT NULL ,"ID_Client" INTEGER NOT NULL ,"Content" TEXT NOT NULL ,"ID_Image" INTEGER DEFAULT (NULL) )',
	adapter: "dbAdapter"
});

/*
 * Log
 */
var Log = CRUD.define({
	className: "Log",
	table: "logging",
	primary: "ID_Log",
	fields: ["ID_Log","Timestamp","Logstring","GPS","ID_User"],
	relations: { 
		"User" : CRUD.RELATION_FOREIGN
	}, 
	connectors: {
		
 	},
 	createStatement: 'CREATE TABLE "logging" ("ID_Log" INTEGER PRIMARY KEY  AUTOINCREMENT , "Timestamp" DATETIME NOT NULL  DEFAULT CURRENT_TIMESTAMP, "Logstring" VARCHAR NOT NULL , "GPS" TEXT, "ID_User" INTEGER NOT NULL  check(typeof("ID_User") = "integer") )',
	adapter: "dbAdapter"
});

/*
 * User
 */
var User = CRUD.define({
	className: "User",
	table: "users",
	primary: "ID_User",
	fields: ["ID_User","name","surname","presentation_group_id","ID_Client","photo_file_name","photo_content_type","photo_file_size","photo_updated_at","email","encrypted_password","reset_password_token","reset_password_sent_at","remember_token","remember_created_at","sign_in_count","current_sign_in_at","last_sign_in_at","current_sign_in_ip","last_sign_in_ip","created_at","updated_at","role","username","isTabletUser","isExported"],
	relations: { 
		"Client" : CRUD.RELATION_MANY
		"Presentation" : CRUD.RELATION_MANY
		"Client" : CRUD.RELATION_FOREIGN
		"Report" : dbObject.RELATION_SINGLE
		"Log" : dbObject.RELATION_SINGLE
		"Slide" : dbObject.RELATION_SINGLE
		"UsergroupManager" : dbObject.RELATION_SINGLE
		"Invoice" : dbObject.RELATION_SINGLE
	}, 
	connectors: {
		"Client" : "Quote"
		"Presentation" : "PresentationUser"
 	},
 	createStatement: 'CREATE TABLE "users" ("ID_User" INTEGER PRIMARY KEY ,"name" varchar(255),"surname" varchar(255),"presentation_group_id" integer,"ID_Client" integer,"photo_file_name" varchar(255),"photo_content_type" varchar(255),"photo_file_size" integer,"photo_updated_at" datetime,"email" varchar(255),"encrypted_password" varchar(128),"reset_password_token" varchar(255),"reset_password_sent_at" datetime,"remember_token" varchar(255),"remember_created_at" datetime,"sign_in_count" integer,"current_sign_in_at" datetime,"last_sign_in_at" datetime,"current_sign_in_ip" varchar(255),"last_sign_in_ip" varchar(255),"created_at" datetime,"updated_at" datetime,"role" STRING,"username" VARCHAR DEFAULT (50) , "isTabletUser" CHAR DEFAULT 1, `comments`  text, "isExported" varchar DEFAULT 0)',
	adapter: "dbAdapter"
});

/*
 * UserGroup
 */
var UserGroup = CRUD.define({
	className: "UserGroup",
	table: "usergroups",
	primary: "ID_UserGroup",
	fields: ["ID_UserGroup","Groupname","Description","ID_Manager","lastUpdated","enabled","ID_Client"],
	relations: { 
		"Group" : CRUD.RELATION_MANY
		"Client" : CRUD.RELATION_FOREIGN
	}, 
	connectors: {
		"Group" : "PresentationGroupUserGroup"
 	},
 	createStatement: 'CREATE TABLE "usergroups" ("ID_UserGroup" INTEGER PRIMARY KEY  NOT NULL , "Groupname" VARCHAR, "Description" VARCHAR, "ID_Manager" INTEGER, "lastUpdated" DATETIME, "enabled" CHAR, "ID_Client" INTEGER)',
	adapter: "dbAdapter"
});

/*
 * Group
 */
var Group = CRUD.define({
	className: "Group",
	table: "presentationgroups",
	primary: "ID_Group",
	fields: ["ID_Group","Name","Description","ID_Client"],
	relations: { 
		"UserGroup" : CRUD.RELATION_MANY
		"Presentation" : CRUD.RELATION_MANY
		"Client" : CRUD.RELATION_FOREIGN
	}, 
	connectors: {
		"UserGroup" : "PresentationGroupUserGroup"
		"Presentation" : "PresentationGroupPresentation"
 	},
 	createStatement: 'CREATE TABLE "presentationgroups" ("ID_Group" INTEGER PRIMARY KEY  NOT NULL ,"Name" varchar(255) NOT NULL ,"Description" varchar(1024) NOT NULL ,"ID_Client" int(11) DEFAULT (NULL), `ID_ParentGroup`  INTEGER, `sortOrder`  INT)',
	adapter: "dbAdapter"
});

/*
 * PresentationGroupUserGroup
 */
var PresentationGroupUserGroup = CRUD.define({
	className: "PresentationGroupUserGroup",
	table: "presentationgroups_usergroups",
	primary: "ID_PresentationGroupUserGroup",
	fields: ["ID_PresentationGroupUserGroup","ID_Group","ID_UserGroup"],
	relations: { 
		"UserGroup" : CRUD.RELATION_FOREIGN
		"Group" : CRUD.RELATION_FOREIGN
	}, 
	connectors: {
		
 	},
 	createStatement: 'CREATE TABLE "presentationgroups_usergroups" ("ID_PresentationGroupUserGroup" INTEGER PRIMARY KEY  NOT NULL ,"ID_Group" INTEGER NOT NULL ,"ID_UserGroup" INTEGER NOT NULL )',
	adapter: "dbAdapter"
});

/*
 * PresentationUser
 */
var PresentationUser = CRUD.define({
	className: "PresentationUser",
	table: "presentations_users",
	primary: "ID_PresentationUser",
	fields: ["ID_PresentationUser","ID_Presentation","ID_User"],
	relations: { 
		"Presentation" : CRUD.RELATION_FOREIGN
		"User" : CRUD.RELATION_FOREIGN
	}, 
	connectors: {
		
 	},
 	createStatement: 'CREATE TABLE "presentations_users" ("ID_PresentationUser" INTEGER PRIMARY KEY  NOT NULL ,"ID_Presentation" INTEGER NOT NULL ,"ID_User" INTEGER NOT NULL )',
	adapter: "dbAdapter"
});

/*
 * PresentationGroupPresentation
 */
var PresentationGroupPresentation = CRUD.define({
	className: "PresentationGroupPresentation",
	table: "presentationgroups_presentations",
	primary: "ID_PresentationGroupPresentation",
	fields: ["ID_PresentationGroupPresentation","ID_Group","ID_Presentation"],
	relations: { 
		"Presentation" : CRUD.RELATION_FOREIGN
		"Group" : CRUD.RELATION_FOREIGN
	}, 
	connectors: {
		
 	},
 	createStatement: 'CREATE TABLE presentationgroups_presentations (
   ID_PresentationGroupPresentation INTEGER PRIMARY KEY NOT NULL,
   ID_Group int(11) NOT NULL,
   ID_Presentation int(11) NOT NULL
 )',
	adapter: "dbAdapter"
});

/*
 * Slide
 */
var Slide = CRUD.define({
	className: "Slide",
	table: "slides",
	primary: "ID_Slide",
	fields: ["ID_Slide","ID_User","Title","SubTitle","Content1","Content2","Content3","ID_SlideTemplate","lastUpdated"],
	relations: { 
		"Presentation" : CRUD.RELATION_MANY
		"Category" : CRUD.RELATION_MANY
		"Image" : CRUD.RELATION_MANY
		"Product" : CRUD.RELATION_MANY
		"Video" : CRUD.RELATION_MANY
		"User" : CRUD.RELATION_FOREIGN
	}, 
	connectors: {
		"Presentation" : "PresentationSlide"
		"Category" : "SlideCategory"
		"Image" : "SlideImage"
		"Product" : "SlideProduct"
		"Video" : "SlideVideo"
 	},
 	createStatement: 'CREATE TABLE slides (
 -- Comments: 
 -- Slides are defined here
 --
 
   ID_Slide INTEGER PRIMARY KEY NOT NULL,
   ID_User int(11) NOT NULL,
   Title varchar(250) NOT NULL,
   SubTitle varchar(1024) NOT NULL,
   Content1 mediumtext NOT NULL,
   Content2 mediumtext NOT NULL,
   Content3 mediumtext NOT NULL,
   ID_SlideTemplate int(11) NOT NULL,
   lastUpdated timestamp NULL
 )',
	adapter: "dbAdapter"
});

/*
 * UsergroupManager
 */
var UsergroupManager = CRUD.define({
	className: "UsergroupManager",
	table: "usergroups_managers",
	primary: "ID_Usergroup_Manager",
	fields: ["ID_Usergroup_Manager","ID_Usergroup","ID_User"],
	relations: { 
		"User" : CRUD.RELATION_FOREIGN
	}, 
	connectors: {
		
 	},
 	createStatement: 'CREATE TABLE "usergroups_managers" ("ID_Usergroup_Manager" INTEGER PRIMARY KEY  NOT NULL ,"ID_Usergroup" INTEGER NOT NULL ,"ID_User" INTEGER NOT NULL )',
	adapter: "dbAdapter"
});

/*
 * Invoice
 */
var Invoice = CRUD.define({
	className: "Invoice",
	table: "invoices",
	primary: "ID_Invoice",
	fields: ["ID_Invoice","ID_Client","ID_User","ID_InvoiceTemplate","invoiceCreated","PDFHtml","CustomerPDF","PrivatePDF","Status","invoiceNumber","paymentDate","grandTotal","customerName","customerCompany"],
	relations: { 
		"Client" : CRUD.RELATION_FOREIGN
		"User" : CRUD.RELATION_FOREIGN
		"InvoiceRow" : dbObject.RELATION_SINGLE
	}, 
	connectors: {
		
 	},
 	createStatement: 'CREATE TABLE "invoices" ("ID_Invoice" INTEGER PRIMARY KEY  NOT NULL ,"ID_Client" int(11) NOT NULL ,"ID_User" int(11) NOT NULL ,"ID_InvoiceTemplate" int(11) NOT NULL ,"invoiceCreated" timestamp NOT NULL  DEFAULT (CURRENT_TIMESTAMP) ,"PDFHtml" text NOT NULL ,"CustomerPDF" blob NOT NULL ,"PrivatePDF" blob NOT NULL ,"Status" enum(9) NOT NULL ,"invoiceNumber" varchar(25) NOT NULL ,"paymentDate" date NOT NULL ,"grandTotal" double(8,2) NOT NULL ,"customerName" varchar,"customerCompany" VARCHAR)',
	adapter: "dbAdapter"
});

/*
 * Quote
 */
var Quote = CRUD.define({
	className: "Quote",
	table: "quotes",
	primary: "ID_Quote",
	fields: ["ID_Quote","ID_Client","ID_User","ID_QuoteTemplate","quoteCreated","PDFHtml","CustomerPDF","PrivatePDF","Status","quoteNumber","paymentDate","grandTotal","customerName","customerCompany","gps","sessionData"],
	relations: { 
		"Client" : CRUD.RELATION_FOREIGN
		"User" : CRUD.RELATION_FOREIGN
	}, 
	connectors: {
		
 	},
 	createStatement: 'CREATE TABLE "quotes" ("ID_Quote" INTEGER PRIMARY KEY  NOT NULL ,"ID_Client" int(11) NOT NULL ,"ID_User" int(11) NOT NULL ,"ID_QuoteTemplate" int(11) NOT NULL ,"quoteCreated" timestamp NOT NULL  DEFAULT (CURRENT_TIMESTAMP) ,"PDFHtml" text NOT NULL ,"CustomerPDF" blob NOT NULL ,"PrivatePDF" blob NOT NULL ,"Status" enum(9) NOT NULL ,"quoteNumber" varchar(25) NOT NULL ,"paymentDate" date NOT NULL ,"grandTotal" double(8,2) NOT NULL ,"customerName" varchar,"customerCompany" VARCHAR, "gps" varchar(100), "sessionData" TEXT NULL)',
	adapter: "dbAdapter"
});