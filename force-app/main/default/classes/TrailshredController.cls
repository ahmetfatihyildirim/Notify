public with sharing class TrailshredController {

    @TestVisible
    private static List<Trailshred_Setting__mdt> mockSettings { get; set; }

    @AuraEnabled( cacheable = true )
    public static List<Trailshred_Setting__mdt> getSettings( String objectApiName ) {
        List<Trailshred_Setting__mdt> settings = [
            SELECT
                Id,
                MasterLabel,
                DeveloperName,
                Active__c,
                Audio_Static_Resource_Path__c,
                Object_Name__c,
                Object_Name__r.QualifiedApiName,
                Field_Name__c,
                Field_Name__r.QualifiedApiName,
                Field_Value__c
            FROM
                Trailshred_Setting__mdt
            WHERE
                Active__c = true
                AND
                Object_Name__r.QualifiedApiName = :objectApiName
        ];
        return ( Test.isRunningTest() && mockSettings != null ? mockSettings : settings );
        //koşul ? koşulun gerçekleşme durumu : koşulun gerçekleşmeme durumu;
        //condition ? exprIfTrue : exprIfFalse
    }
}