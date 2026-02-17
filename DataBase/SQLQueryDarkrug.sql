--create database darkrug
use darkrug;

-- Таблица Мессенджеров
CREATE TABLE Messengers (
	Id int IDENTITY(1,1) PRIMARY KEY,
	WhatsApp nvarchar(50),
	Telegram nvarchar(50),
	VK nvarchar(50),
	[Max] nvarchar(50)
);

-- Таблица пользователей
CREATE TABLE Users (
    Id int IDENTITY(1,1) PRIMARY KEY,
    UserName nvarchar(255) UNIQUE NOT NULL,
    Email nvarchar(255) UNIQUE NOT NULL,
	[Password] nvarchar(255) NOT NULL,
    Phone nvarchar(50),
	MessengerId int NOT NULL FOREIGN KEY REFERENCES Messengers(Id),
    Photo VARBINARY(MAX)
);

-- Таблица изображений
CREATE TABLE Images (
    Id int IDENTITY(1,1) PRIMARY KEY,
    Image1 VARBINARY(MAX) NOT NULL,
	Image2 VARBINARY(MAX),
	Image3 VARBINARY(MAX),
	Image4 VARBINARY(MAX),
	Image5 VARBINARY(MAX)
);

-- Таблица постов
CREATE TABLE Posts (
    Id int IDENTITY(1,1) PRIMARY KEY,
	UserId int NOT NULL FOREIGN KEY REFERENCES Users(Id),
    Title nvarchar(500) NOT NULL,
    [Description] text NOT NULL,
	ImagesId int NOT NULL FOREIGN KEY REFERENCES Images(Id),
	CreatedDate datetime DEFAULT GETDATE()
);

-- Таблица категорий
CREATE TABLE Categories (
    Id int IDENTITY(1,1) PRIMARY KEY,
    [Name] nvarchar(255) NOT NULL
);

-- Связующая таблица Категории-Посты (многие-ко-многим)
CREATE TABLE CategoryOfPost (
    CategoryId int NOT NULL FOREIGN KEY REFERENCES Categories(Id),
    PostId int NOT NULL FOREIGN KEY REFERENCES Posts(Id)
);

-- Избранное (многие-ко-многим Посты-Пользователи)
CREATE TABLE Favorites (
    PostId int NOT NULL FOREIGN KEY REFERENCES Posts(Id),
    UserId int NOT NULL FOREIGN KEY REFERENCES Users(Id)
);

-- Таблица метро (станции или линии)
CREATE TABLE Metro (
    Id int IDENTITY(1,1) PRIMARY KEY,
    Metro nvarchar(255) NOT NULL
);

-- Связующая таблица Метро-Участники (многие-ко-многим)
CREATE TABLE MetroNeardy (
    MetroId int NOT NULL FOREIGN KEY REFERENCES Metro(Id),
    UserId int NOT NULL FOREIGN KEY REFERENCES Users(Id)
);
