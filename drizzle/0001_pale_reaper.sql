CREATE TABLE `build_configurations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`packageId` varchar(255) NOT NULL,
	`appVersion` varchar(64) NOT NULL,
	`appName` varchar(255) NOT NULL,
	`targetUrl` text NOT NULL,
	`iconUrl` text,
	`splashUrl` text,
	`description` text,
	`repositoryName` varchar(255),
	`repositoryUrl` text,
	`isPublic` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `build_configurations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `build_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`buildId` int NOT NULL,
	`logContent` longtext NOT NULL,
	`logType` enum('stdout','stderr','info','warning','error') NOT NULL DEFAULT 'stdout',
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `build_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `build_notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`buildId` int NOT NULL,
	`userId` int NOT NULL,
	`notificationType` enum('email','toast','webhook') NOT NULL,
	`status` enum('pending','sent','failed') NOT NULL DEFAULT 'pending',
	`message` text,
	`sentAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `build_notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `builds` (
	`id` int AUTO_INCREMENT NOT NULL,
	`configurationId` int NOT NULL,
	`userId` int NOT NULL,
	`status` enum('pending','running','success','failed','cancelled') NOT NULL DEFAULT 'pending',
	`githubRunId` varchar(64),
	`githubRunNumber` int,
	`artifactUrl` text,
	`artifactSize` decimal(15,2),
	`errorMessage` longtext,
	`startedAt` timestamp,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `builds_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `github_tokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`accessToken` text NOT NULL,
	`refreshToken` text,
	`tokenExpiry` timestamp,
	`githubUsername` varchar(255) NOT NULL,
	`githubId` varchar(64) NOT NULL,
	`scope` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `github_tokens_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `workflow_configs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`configurationId` int NOT NULL,
	`workflowYaml` longtext NOT NULL,
	`workflowName` varchar(255) NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `workflow_configs_id` PRIMARY KEY(`id`)
);
