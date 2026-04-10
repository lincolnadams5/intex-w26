namespace IntexBackendApi.DTOs;

public class SafehouseOutcomeDriverDto
{
    public long      Id            { get; set; }
    public DateOnly? RunDate       { get; set; }
    public int?      SafehouseId   { get; set; }
    public string?   SafehouseName { get; set; }   // from JOIN
    public string?   Region        { get; set; }
    public decimal?  VarHealth     { get; set; }
    public decimal?  VarEdu        { get; set; }
    public bool?     FlaggedHealth { get; set; }
    public bool?     FlaggedEdu    { get; set; }
    public string?   FlaggedFor    { get; set; }
    public string?   Note          { get; set; }
}
