USE [EMS_George]
GO

/****** Object:  Table [dbo].[GL_Outbox]    Script Date: 2026/04/07 10:16:40 ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[GL_Outbox](
	[OutboxId] [uniqueidentifier] NOT NULL,
	[SubmoduleId] [int] NOT NULL,
	[EventType] [varchar](100) NOT NULL,
	[DocumentNumber] [nvarchar](100) NOT NULL,
	[Status] [varchar](20) NOT NULL,
	[RetryCount] [int] NOT NULL,
	[CreatedAt] [datetime2](7) NOT NULL,
	[DispatchedAt] [datetime2](7) NULL,
	[GLBatchId] [uniqueidentifier] NULL,
	[AcknowledgedAt] [datetime2](7) NULL,
	[LastError] [nvarchar](500) NULL,
	[IsCashflow] [bit] NOT NULL,
 CONSTRAINT [PK_GL_Outbox] PRIMARY KEY CLUSTERED 
(
	[OutboxId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO

ALTER TABLE [dbo].[GL_Outbox] ADD  CONSTRAINT [DF__GL_Outbox__OutboxId]  DEFAULT (newsequentialid()) FOR [OutboxId]
GO

ALTER TABLE [dbo].[GL_Outbox] ADD  CONSTRAINT [DF__GL_Outbox__Status]  DEFAULT ('PENDING') FOR [Status]
GO

ALTER TABLE [dbo].[GL_Outbox] ADD  CONSTRAINT [DF__GL_Outbox__RetryCount]  DEFAULT ((0)) FOR [RetryCount]
GO

ALTER TABLE [dbo].[GL_Outbox] ADD  CONSTRAINT [DF__GL_Outbox__CreatedAt]  DEFAULT (sysutcdatetime()) FOR [CreatedAt]
GO
