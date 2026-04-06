using IntexBackendApi.Data;
using IntexBackendApi.Models;
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
}
