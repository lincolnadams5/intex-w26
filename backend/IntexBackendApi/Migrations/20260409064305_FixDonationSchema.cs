using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class FixDonationSchema : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "created_by_partner_id",
                table: "donations");

            migrationBuilder.DropColumn(
                name: "referral_post_id",
                table: "donations");

            migrationBuilder.AlterColumn<DateTime>(
                name: "donation_date",
                table: "donations",
                type: "timestamp with time zone",
                nullable: true,
                oldClrType: typeof(DateOnly),
                oldType: "date",
                oldNullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<DateOnly>(
                name: "donation_date",
                table: "donations",
                type: "date",
                nullable: true,
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone",
                oldNullable: true);

            migrationBuilder.AddColumn<int>(
                name: "created_by_partner_id",
                table: "donations",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "referral_post_id",
                table: "donations",
                type: "integer",
                nullable: true);
        }
    }
}
