using IntexBackendApi.Data;
using IntexBackendApi.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace IntexBackendApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SafehousesController : ControllerBase
{
    private readonly AppDbContext _db;

    public SafehousesController(AppDbContext db)
    {
        _db = db;
    }

    // Public — no auth required (used by the landing/impact pages)
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Safehouse>>> GetAll()
    {
        return await _db.Safehouses.ToListAsync();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Safehouse>> GetById(int id)
    {
        var safehouse = await _db.Safehouses.FindAsync(id);
        if (safehouse == null) return NotFound();
        return safehouse;
    }

    // Staff + Admin: create a safehouse
    [HttpPost]
    [Authorize(Policy = "StaffOrAdmin")]
    public async Task<ActionResult<Safehouse>> Create([FromBody] Safehouse safehouse)
    {
        _db.Safehouses.Add(safehouse);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = safehouse.SafehouseId }, safehouse);
    }

    // Staff + Admin: update a safehouse
    [HttpPut("{id}")]
    [Authorize(Policy = "StaffOrAdmin")]
    public async Task<IActionResult> Update(int id, [FromBody] Safehouse updated)
    {
        if (id != updated.SafehouseId) return BadRequest();
        _db.Entry(updated).State = EntityState.Modified;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    // Admin only: delete a safehouse (requires explicit ?confirmed=true)
    [HttpDelete("{id}")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> Delete(int id, [FromQuery] bool confirmed = false)
    {
        if (!confirmed)
            return BadRequest(new { message = "Deletion must be explicitly confirmed. Pass ?confirmed=true" });

        var safehouse = await _db.Safehouses.FindAsync(id);
        if (safehouse == null) return NotFound();

        _db.Safehouses.Remove(safehouse);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
