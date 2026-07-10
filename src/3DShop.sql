CREATE TABLE "Account" (
  "Id" uuid PRIMARY KEY,
  "Username" nvarchar(20) UNIQUE NOT NULL,
  "Fullname" nvarchar(40),
  "Email" nvarchar(40) UNIQUE,
  "ProfileImageURL" nvarchar(255),
  "ContactPhone" nvarchar(15),
  "ZaloPhone" nvarchar(15),
  "PasswordHash" nvarchar(255) NOT NULL,
  "Isactive" bit DEFAULT true
);

CREATE TABLE "Customer" (
  "Id" uuid PRIMARY KEY,
  "AccountId" uuid UNIQUE NOT NULL,
  "DateOfBirth" datetime
);

CREATE TABLE "Manager" (
  "Id" uuid PRIMARY KEY,
  "AccountId" uuid UNIQUE NOT NULL
);

CREATE TABLE "Staff" (
  "Id" uuid PRIMARY KEY,
  "AccountId" uuid UNIQUE NOT NULL
);

CREATE TABLE "Order" (
  "Id" uuid PRIMARY KEY,
  "CustomerId" uuid NOT NULL,
  "StaffId" uuid,
  "TotalPrice" decimal,
  "OrderStatus" varchar,
  "Priority" int
);

CREATE TABLE "Shipment" (
  "Id" uuid PRIMARY KEY,
  "ShippingMethodId" uuid NOT NULL,
  "ShippingAddressId" uuid NOT NULL,
  "OrderId" uuid NOT NULL,
  "ShippingFee" decimal,
  "TrackingNumber" varchar,
  "EstimatedDeliveryTime" datetime,
  "ShipmentStatus" varchar,
  "ShippedAt" datetime,
  "DeliveredAt" datetime
);

CREATE TABLE "ShippingAddress" (
  "Id" uuid PRIMARY KEY,
  "CustomerId" uuid NOT NULL,
  "ReceiverName" varchar,
  "Phone" varchar,
  "AddressLine" varchar,
  "Ward" varchar,
  "District" varchar,
  "City" varchar,
  "Province" varchar,
  "IsDefault" boolean
);

CREATE TABLE "ShippingMethod" (
  "Id" uuid PRIMARY KEY,
  "Code" varchar,
  "Name" varchar,
  "Provider" varchar,
  "EstimatedDays" int,
  "IsActive" boolean
);

CREATE TABLE "DesignTemplate" (
  "Id" uuid PRIMARY KEY,
  "Code" varchar(50) UNIQUE NOT NULL,
  "Name" varchar(255) NOT NULL,
  "Description" text,
  "FileUrl" varchar NOT NULL,
  "ThumbnailUrl" varchar,
  "IsActive" boolean
);

CREATE TABLE "DesignVariant" (
  "Id" uuid PRIMARY KEY,
  "DesignTemplateId" uuid,
  "MaterialId" uuid,
  "SizeScale" decimal,
  "Stockquantity" int NOT NULL DEFAULT 0,
  "MinimumStockLevel" int DEFAULT 5,
  "IsAllowPreOrder" boolean DEFAULT true,
  "EstimatedWeightPerUnit" decimal,
  "EstimatedPrintTimePerUnit" decimal,
  "MarkupPercentage" decimal DEFAULT 0,
  "Code" varchar(50) UNIQUE NOT NULL,
  "Name" varchar(255) NOT NULL,
  "Description" text,
  "Price" decimal(18,2) NOT NULL DEFAULT 0,
  "PreviewModelUrl" varchar,
  "IsActive" boolean DEFAULT true
);

CREATE TABLE "ConceptTag" (
  "Id" uuid PRIMARY KEY,
  "Name" varchar(100) UNIQUE NOT NULL,
  "Description" text
  "IsActive" boolean DEFAULT true
);

CREATE TABLE "DesignTag" (
  "Id" uuid,
  "ConceptTagId" uuid,
  "DesignTemplateId" uuid,
  "IsMainTag" boolean DEFAULT false,
  
);

CREATE TABLE "ServicePackage" (
  "Id" uuid PRIMARY KEY,
  "Code" varchar UNIQUE,
  "Name" nvarchar(100),
  "BasePrice" decimal(18,2),
  "Description" text,
  "Is_Supported" boolean DEFAULT true,
  "HtmlRaw" nvarchar(255)
);

CREATE TABLE "DesignWork" (
  "Id" uuid PRIMARY KEY,
  "ServicePackageId" uuid,
  "name" nvarchar(255),
  "SourceType" varchar,
  "TemplateId" uuid,
  "CustomerId" uuid,
  "MainAssignedStaffId" uuid,
  "BaseImageUrl" nvarchar(255),
  "ResultDraftId" uuid,
  "Status" varchar
);

CREATE TABLE "DesignLog" (
  "Id" uuid PRIMARY KEY,
  "DesignWorkId" uuid,
  "IsAI" boolean DEFAULT false,
  "AccountId" uuid,
  "Content" nvarchar(max),
  "Metadata" nvarchar(max),
  "LogType" varchar(30)
);

CREATE TABLE "DesignVersionHistory" (
  "Id" uuid PRIMARY KEY,
  "DesignWorkId" uuid,
  "DesignLogId" uuid,
  "UploaderId" uuid,
  "FileUrl" varchar,
  "VersionNumber" int,
  "IsPreviewable" boolean,
  "IsPrintable" boolean
);

CREATE TABLE "TechnicalDraft" (
  "Id" uuid PRIMARY KEY,
  "DesignVersionHistoryId" uuid NOT NULL,
  "MaterialId" uuid NOT NULL,
  "InfillDensity" int,
  "LayerHeight" decimal,
  "EstimatedWeightPerUnit" decimal,
  "EstimatedPrintTimePerUnit" decimal,
  "MarkupPercentage" decimal DEFAULT 0,
  "TechnicalNote" text
);

CREATE TABLE "OrderItem" (
  "Id" uuid PRIMARY KEY,
  "OrderId" uuid NOT NULL,
  "SourceType" varchar,
  "DesignWorkId" uuid,
  "DesignVariantId" uuid,
  "TechnicalDraftId" uuid,
  "QuantityOrdered" int,
  "UnitPrice" decimal,
  "TotalPrice" decimal,
  "TotalServiceCostPerGram" decimal(18,4) NOT NULL,
  "FulfillmentStatus" varchar
);

CREATE TABLE "Material" (
  "Id" uuid PRIMARY KEY,
  "Name" varchar NOT NULL,
  "Description" text,
  "IsActive" boolean DEFAULT true
);

CREATE TABLE "MaterialPriceHistory" (
  "Id" uuid PRIMARY KEY,
  "MaterialId" uuid,
  "BaseCostPerGram" decimal(18,4) NOT NULL,
  "TotalServiceCostPerGram" decimal(18,4) NOT NULL,
  "EffectiveDate" datetime NOT NULL,
  "IsCurrent" boolean DEFAULT true
);

CREATE TABLE "Invoice" (
  "Id" uuid PRIMARY KEY,
  "OrderId" uuid,
  "InvoiceCode" varchar UNIQUE,
  "SubTotal" decimal(18,2),
  "TaxAmount" decimal(18,2),
  "ShippingFee" decimal(18,2),
  "TotalAmount" decimal(18,2),
  "PaymentStatus" varchar,
  "DueDate" datetime,
  "CreatedAt" datetime
);

CREATE TABLE "Transaction" (
  "Id" uuid PRIMARY KEY,
  "InvoiceId" uuid,
  "Amount" decimal(18,2),
  "PaymentMethod" varchar,
  "ExternalTransactionId" varchar,
  "Note" text,
  "TransactionStatus" varchar,
  "CreatedAt" datetime
);

CREATE TABLE "InventoryTransaction" (
  "Id" uuid PRIMARY KEY,
  "DesignVariantId" uuid,
  "StaffId" uuid,
  "Type" varchar,
  "Quantity" int,
  "ReferenceId" uuid,
  "Note" text
);

COMMENT ON COLUMN "TechnicalDraft"."InfillDensity" IS 'Độ đặc khi in (%)';

COMMENT ON COLUMN "TechnicalDraft"."LayerHeight" IS 'Độ dày lớp in (mm)';

COMMENT ON COLUMN "TechnicalDraft"."TechnicalNote" IS 'Ghi chú về support, hướng đặt mẫu trên bàn in...';

ALTER TABLE "Customer" ADD FOREIGN KEY ("AccountId") REFERENCES "Account" ("Id");

ALTER TABLE "Manager" ADD FOREIGN KEY ("AccountId") REFERENCES "Account" ("Id");

ALTER TABLE "Staff" ADD FOREIGN KEY ("AccountId") REFERENCES "Account" ("Id");

ALTER TABLE "Order" ADD FOREIGN KEY ("CustomerId") REFERENCES "Customer" ("Id");

ALTER TABLE "Order" ADD FOREIGN KEY ("StaffId") REFERENCES "Staff" ("Id");

ALTER TABLE "Shipment" ADD FOREIGN KEY ("OrderId") REFERENCES "Order" ("Id");

ALTER TABLE "Shipment" ADD FOREIGN KEY ("ShippingMethodId") REFERENCES "ShippingMethod" ("Id");

ALTER TABLE "Shipment" ADD FOREIGN KEY ("ShippingAddressId") REFERENCES "ShippingAddress" ("Id");

ALTER TABLE "ShippingAddress" ADD FOREIGN KEY ("CustomerId") REFERENCES "Customer" ("Id");

ALTER TABLE "DesignVariant" ADD FOREIGN KEY ("DesignTemplateId") REFERENCES "DesignTemplate" ("Id");

ALTER TABLE "DesignVariant" ADD FOREIGN KEY ("MaterialId") REFERENCES "Material" ("Id");

ALTER TABLE "DesignTag" ADD FOREIGN KEY ("ConceptTagId") REFERENCES "ConceptTag" ("Id");

ALTER TABLE "DesignTag" ADD FOREIGN KEY ("DesignTemplateId") REFERENCES "DesignTemplate" ("Id");

ALTER TABLE "DesignWork" ADD FOREIGN KEY ("ServicePackageId") REFERENCES "ServicePackage" ("Id");

ALTER TABLE "DesignWork" ADD FOREIGN KEY ("TemplateId") REFERENCES "DesignTemplate" ("Id");

ALTER TABLE "DesignWork" ADD FOREIGN KEY ("CustomerId") REFERENCES "Customer" ("Id");

ALTER TABLE "DesignWork" ADD FOREIGN KEY ("MainAssignedStaffId") REFERENCES "Staff" ("Id");

ALTER TABLE "DesignLog" ADD FOREIGN KEY ("DesignWorkId") REFERENCES "DesignWork" ("Id");

ALTER TABLE "DesignLog" ADD FOREIGN KEY ("AccountId") REFERENCES "Account" ("Id");

ALTER TABLE "DesignVersionHistory" ADD FOREIGN KEY ("DesignWorkId") REFERENCES "DesignWork" ("Id");

ALTER TABLE "DesignVersionHistory" ADD FOREIGN KEY ("DesignLogId") REFERENCES "DesignLog" ("Id");

ALTER TABLE "DesignVersionHistory" ADD FOREIGN KEY ("UploaderId") REFERENCES "Account" ("Id");

ALTER TABLE "TechnicalDraft" ADD FOREIGN KEY ("DesignVersionHistoryId") REFERENCES "DesignVersionHistory" ("Id");

ALTER TABLE "TechnicalDraft" ADD FOREIGN KEY ("MaterialId") REFERENCES "Material" ("Id");

ALTER TABLE "OrderItem" ADD FOREIGN KEY ("DesignWorkId") REFERENCES "DesignWork" ("Id");

ALTER TABLE "OrderItem" ADD FOREIGN KEY ("DesignVariantId") REFERENCES "DesignVariant" ("Id");

ALTER TABLE "OrderItem" ADD FOREIGN KEY ("TechnicalDraftId") REFERENCES "TechnicalDraft" ("Id");

ALTER TABLE "MaterialPriceHistory" ADD FOREIGN KEY ("MaterialId") REFERENCES "Material" ("Id");

ALTER TABLE "Invoice" ADD FOREIGN KEY ("OrderId") REFERENCES "Order" ("Id");

ALTER TABLE "Transaction" ADD FOREIGN KEY ("InvoiceId") REFERENCES "Invoice" ("Id");

ALTER TABLE "OrderItem" ADD FOREIGN KEY ("OrderId") REFERENCES "Order" ("Id");

ALTER TABLE "InventoryTransaction" ADD FOREIGN KEY ("DesignVariantId") REFERENCES "DesignVariant" ("Id");

ALTER TABLE "InventoryTransaction" ADD FOREIGN KEY ("StaffId") REFERENCES "Staff" ("Id");
