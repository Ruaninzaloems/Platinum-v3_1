SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[GL_Outbox_Lines](
	[LineId] [bigint] IDENTITY(1,1) NOT NULL,
	[OutboxId] [uniqueidentifier] NOT NULL,
	[ProcessingMonth] [int] NOT NULL,
	[FinYear] [varchar](10) NOT NULL,
	[TransactionDetails] [nvarchar](500) NULL,
	[SourceModuleId] [int] NOT NULL,
	[Debit] [decimal](18, 2) NOT NULL,
	[Credit] [decimal](18, 2) NOT NULL,
	[CapturerId] [int] NOT NULL,
	[PlanProjectItemID] [int] NOT NULL,
	[VATRate] [decimal](5, 2) NULL,
	[VATRateID] [int] NOT NULL,
 CONSTRAINT [PK_GL_Outbox_Lines] PRIMARY KEY CLUSTERED 
(
	[LineId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO

ALTER TABLE [dbo].[GL_Outbox_Lines] ADD  CONSTRAINT [DF__GL_Outbox__Lines__Debit]  DEFAULT ((0)) FOR [Debit]
GO

ALTER TABLE [dbo].[GL_Outbox_Lines] ADD  CONSTRAINT [DF__GL_Outbox__Lines__Credit]  DEFAULT ((0)) FOR [Credit]
GO

ALTER TABLE [dbo].[GL_Outbox_Lines] ADD  CONSTRAINT [DF__GL_Outbox__Lines__VATRate]  DEFAULT ((0)) FOR [VATRate]
GO

ALTER TABLE [dbo].[GL_Outbox_Lines]  WITH CHECK ADD  CONSTRAINT [FK_GL_Outbox_Lines_Header] FOREIGN KEY([OutboxId])
REFERENCES [dbo].[GL_Outbox] ([OutboxId])
GO

ALTER TABLE [dbo].[GL_Outbox_Lines] CHECK CONSTRAINT [FK_GL_Outbox_Lines_Header]
GO


