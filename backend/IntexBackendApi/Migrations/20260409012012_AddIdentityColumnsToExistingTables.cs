using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class AddIdentityColumnsToExistingTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Add sequences to pre-existing tables that were created outside EF migrations.
            // supporter_id and donation_id are plain integers with no DEFAULT — these sequences
            // give EF the generated key it expects after INSERT...RETURNING.
            migrationBuilder.Sql(@"
                CREATE SEQUENCE IF NOT EXISTS supporters_supporter_id_seq OWNED BY supporters.supporter_id;
                ALTER TABLE supporters ALTER COLUMN supporter_id SET DEFAULT nextval('supporters_supporter_id_seq');
                SELECT setval('supporters_supporter_id_seq', COALESCE((SELECT MAX(supporter_id) FROM supporters), 0) + 1, false);

                CREATE SEQUENCE IF NOT EXISTS donations_donation_id_seq OWNED BY donations.donation_id;
                ALTER TABLE donations ALTER COLUMN donation_id SET DEFAULT nextval('donations_donation_id_seq');
                SELECT setval('donations_donation_id_seq', COALESCE((SELECT MAX(donation_id) FROM donations), 0) + 1, false);
            ");

            migrationBuilder.AlterColumn<double>(
                name: "estimated_donation_value_php",
                table: "social_media_posts",
                type: "double precision",
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "numeric",
                oldNullable: true);

            migrationBuilder.AlterColumn<double>(
                name: "engagement_rate",
                table: "social_media_posts",
                type: "double precision",
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "numeric",
                oldNullable: true);

            migrationBuilder.AlterColumn<double>(
                name: "boost_budget_php",
                table: "social_media_posts",
                type: "double precision",
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "numeric",
                oldNullable: true);

            migrationBuilder.AlterColumn<DateTime>(
                name: "month_start",
                table: "safehouse_monthly_metrics",
                type: "timestamp with time zone",
                nullable: true,
                oldClrType: typeof(DateOnly),
                oldType: "date",
                oldNullable: true);

            migrationBuilder.AlterColumn<DateTime>(
                name: "month_end",
                table: "safehouse_monthly_metrics",
                type: "timestamp with time zone",
                nullable: true,
                oldClrType: typeof(DateOnly),
                oldType: "date",
                oldNullable: true);

            migrationBuilder.AlterColumn<double>(
                name: "avg_health_score",
                table: "safehouse_monthly_metrics",
                type: "double precision",
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "numeric",
                oldNullable: true);

            migrationBuilder.AlterColumn<double>(
                name: "avg_education_progress",
                table: "safehouse_monthly_metrics",
                type: "double precision",
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "numeric",
                oldNullable: true);

            migrationBuilder.AlterColumn<DateTime>(
                name: "session_date",
                table: "process_recordings",
                type: "timestamp with time zone",
                nullable: true,
                oldClrType: typeof(DateOnly),
                oldType: "date",
                oldNullable: true);

            migrationBuilder.AlterColumn<DateTime>(
                name: "resolution_date",
                table: "incident_reports",
                type: "timestamp with time zone",
                nullable: true,
                oldClrType: typeof(DateOnly),
                oldType: "date",
                oldNullable: true);

            migrationBuilder.AlterColumn<DateTime>(
                name: "incident_date",
                table: "incident_reports",
                type: "timestamp with time zone",
                nullable: true,
                oldClrType: typeof(DateOnly),
                oldType: "date",
                oldNullable: true);

            migrationBuilder.AlterColumn<DateTime>(
                name: "visit_date",
                table: "home_visitations",
                type: "timestamp with time zone",
                nullable: true,
                oldClrType: typeof(DateOnly),
                oldType: "date",
                oldNullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                ALTER TABLE supporters ALTER COLUMN supporter_id DROP DEFAULT;
                DROP SEQUENCE IF EXISTS supporters_supporter_id_seq;

                ALTER TABLE donations ALTER COLUMN donation_id DROP DEFAULT;
                DROP SEQUENCE IF EXISTS donations_donation_id_seq;
            ");

            migrationBuilder.AlterColumn<decimal>(
                name: "estimated_donation_value_php",
                table: "social_media_posts",
                type: "numeric",
                nullable: true,
                oldClrType: typeof(double),
                oldType: "double precision",
                oldNullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "engagement_rate",
                table: "social_media_posts",
                type: "numeric",
                nullable: true,
                oldClrType: typeof(double),
                oldType: "double precision",
                oldNullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "boost_budget_php",
                table: "social_media_posts",
                type: "numeric",
                nullable: true,
                oldClrType: typeof(double),
                oldType: "double precision",
                oldNullable: true);

            migrationBuilder.AlterColumn<DateOnly>(
                name: "month_start",
                table: "safehouse_monthly_metrics",
                type: "date",
                nullable: true,
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone",
                oldNullable: true);

            migrationBuilder.AlterColumn<DateOnly>(
                name: "month_end",
                table: "safehouse_monthly_metrics",
                type: "date",
                nullable: true,
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone",
                oldNullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "avg_health_score",
                table: "safehouse_monthly_metrics",
                type: "numeric",
                nullable: true,
                oldClrType: typeof(double),
                oldType: "double precision",
                oldNullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "avg_education_progress",
                table: "safehouse_monthly_metrics",
                type: "numeric",
                nullable: true,
                oldClrType: typeof(double),
                oldType: "double precision",
                oldNullable: true);

            migrationBuilder.AlterColumn<DateOnly>(
                name: "session_date",
                table: "process_recordings",
                type: "date",
                nullable: true,
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone",
                oldNullable: true);

            migrationBuilder.AlterColumn<DateOnly>(
                name: "resolution_date",
                table: "incident_reports",
                type: "date",
                nullable: true,
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone",
                oldNullable: true);

            migrationBuilder.AlterColumn<DateOnly>(
                name: "incident_date",
                table: "incident_reports",
                type: "date",
                nullable: true,
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone",
                oldNullable: true);

            migrationBuilder.AlterColumn<DateOnly>(
                name: "visit_date",
                table: "home_visitations",
                type: "date",
                nullable: true,
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone",
                oldNullable: true);
        }
    }
}
